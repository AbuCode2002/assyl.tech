import "server-only";
import { desc, gt, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { DateRange } from "@/lib/admin/period";
import { ALMATY, inRange, num, ONLINE_WINDOW_MS, queryRows, tsParam, type RangeInput } from "./sql";

export type KpiValues = {
  visitors: number;
  sessions: number;
  leads: number;
  conversion: number;
  avgDuration: number;
  avgScroll: number;
};

export type Kpis = { current: KpiValues; previous: KpiValues };

export async function getKpis(range: DateRange): Promise<Kpis> {
  const cur = inRange("started_at", range.start, range.end);
  const prev = inRange("started_at", range.prevStart, range.prevEnd);
  const lower = range.prevStart < range.start ? range.prevStart : range.start;

  const [sessionsRow] = await queryRows<Record<string, unknown>>(sql`
    select
      count(distinct visitor_id) filter (where ${cur})::int as visitors,
      count(*) filter (where ${cur})::int as sessions,
      coalesce(avg(duration) filter (where ${cur}), 0)::float8 as avg_duration,
      coalesce(avg(max_scroll) filter (where ${cur}), 0)::float8 as avg_scroll,
      count(distinct visitor_id) filter (where ${prev})::int as p_visitors,
      count(*) filter (where ${prev})::int as p_sessions,
      coalesce(avg(duration) filter (where ${prev}), 0)::float8 as p_avg_duration,
      coalesce(avg(max_scroll) filter (where ${prev}), 0)::float8 as p_avg_scroll
    from sessions
    where started_at >= ${tsParam(lower)} and started_at < ${tsParam(range.end)}
  `);

  const [leadsRow] = await queryRows<Record<string, unknown>>(sql`
    select
      count(*) filter (where ${inRange("created_at", range.start, range.end)})::int as leads,
      count(*) filter (where ${inRange("created_at", range.prevStart, range.prevEnd)})::int as p_leads
    from leads
    where status <> 'spam' and created_at >= ${tsParam(lower)} and created_at < ${tsParam(range.end)}
  `);

  const build = (p: "" | "p_"): KpiValues => {
    const sessions = num(sessionsRow?.[`${p}sessions`]);
    const leads = num(leadsRow?.[`${p}leads`]);
    return {
      visitors: num(sessionsRow?.[`${p}visitors`]),
      sessions,
      leads,
      conversion: sessions > 0 ? leads / sessions : 0,
      avgDuration: num(sessionsRow?.[`${p}avg_duration`]),
      avgScroll: num(sessionsRow?.[`${p}avg_scroll`]),
    };
  };

  return { current: build(""), previous: build("p_") };
}

export type SeriesPoint = { key: string; visitors: number; sessions: number; leads: number };

/** Zero-filled time series in Almaty time: hourly for "today", daily otherwise. */
export async function getTimeSeries(range: DateRange): Promise<SeriesPoint[]> {
  const unit = sql.raw(range.granularity === "hour" ? "'hour'" : "'day'");
  const step = sql.raw(range.granularity === "hour" ? "interval '1 hour'" : "interval '1 day'");
  const fmt = sql.raw(range.granularity === "hour" ? `'HH24:00'` : `'YYYY-MM-DD'`);

  const rows = await queryRows<Record<string, unknown>>(sql`
    with buckets as (
      select generate_series(
        date_trunc(${unit}, ${tsParam(range.start)} at time zone ${ALMATY}),
        date_trunc(${unit}, ${tsParam(range.end)} at time zone ${ALMATY}),
        ${step}
      ) as b
    ),
    s as (
      select date_trunc(${unit}, started_at at time zone ${ALMATY}) as b,
             count(distinct visitor_id)::int as visitors,
             count(*)::int as sessions
      from sessions
      where ${inRange("started_at", range.start, range.end)}
      group by 1
    ),
    l as (
      select date_trunc(${unit}, created_at at time zone ${ALMATY}) as b, count(*)::int as leads
      from leads
      where status <> 'spam' and ${inRange("created_at", range.start, range.end)}
      group by 1
    )
    select to_char(buckets.b, ${fmt}) as key,
           coalesce(s.visitors, 0)::int as visitors,
           coalesce(s.sessions, 0)::int as sessions,
           coalesce(l.leads, 0)::int as leads
    from buckets
    left join s on s.b = buckets.b
    left join l on l.b = buckets.b
    order by buckets.b
  `);

  return rows.map((r) => ({
    key: String(r.key),
    visitors: num(r.visitors),
    sessions: num(r.sessions),
    leads: num(r.leads),
  }));
}

export type ChannelRow = { channel: string; sessions: number; conversions: number };

export async function getChannels(range: RangeInput): Promise<ChannelRow[]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select channel, count(*)::int as sessions, count(*) filter (where converted)::int as conversions
    from sessions
    where ${inRange("started_at", range.start, range.end)}
    group by channel
    order by sessions desc
  `);
  return rows.map((r) => ({ channel: String(r.channel), sessions: num(r.sessions), conversions: num(r.conversions) }));
}

export type CountRow = { key: string; count: number };

export async function getDevices(range: RangeInput): Promise<CountRow[]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select coalesce(device, 'unknown') as key, count(*)::int as count
    from sessions
    where ${inRange("started_at", range.start, range.end)}
    group by 1
    order by count desc
  `);
  return rows.map((r) => ({ key: String(r.key), count: num(r.count) }));
}

export type GeoRow = { country: string | null; city: string | null; count: number };

export async function getGeo(range: RangeInput): Promise<{ countries: GeoRow[]; cities: GeoRow[] }> {
  const where = inRange("started_at", range.start, range.end);
  const [countries, cities] = await Promise.all([
    queryRows<Record<string, unknown>>(sql`
      select country, count(*)::int as count from sessions where ${where}
      group by country order by count desc limit 8
    `),
    queryRows<Record<string, unknown>>(sql`
      select country, city, count(*)::int as count from sessions where ${where} and city is not null
      group by country, city order by count desc limit 8
    `),
  ]);
  const map = (r: Record<string, unknown>): GeoRow => ({
    country: (r.country as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    count: num(r.count),
  });
  return { countries: countries.map(map), cities: cities.map(map) };
}

export type FunnelStep = { id: string; label: string; count: number };

export async function getFunnel(range: RangeInput): Promise<FunnelStep[]> {
  const [r] = await queryRows<Record<string, unknown>>(sql`
    with s as (
      select id, max_scroll, converted from sessions
      where ${inRange("started_at", range.start, range.end)}
    ),
    e as (
      select session_id,
        bool_or(type = 'scroll' and name in ('50', '75', '100')) as scroll50,
        bool_or(type = 'section' and name = 'works') as works,
        bool_or(type = 'form_start') as form_start,
        bool_or(type = 'form_submit') as form_submit
      from events
      where session_id in (select id from s)
      group by session_id
    )
    -- a session counts for a step if it reached that step or any later one,
    -- so the funnel stays monotonic even when a visitor jumps straight to the form
    , f as (
      select
        (s.converted or coalesce(e.form_submit, false)) as submit,
        coalesce(e.form_start, false) as fstart,
        coalesce(e.works, false) as works,
        (s.max_scroll >= 50 or coalesce(e.scroll50, false)) as scroll50
      from s left join e on e.session_id = s.id
    )
    select
      count(*)::int as visits,
      count(*) filter (where scroll50 or works or fstart or submit)::int as scroll50,
      count(*) filter (where works or fstart or submit)::int as works,
      count(*) filter (where fstart or submit)::int as form_start,
      count(*) filter (where submit)::int as form_submit
    from f
  `);
  return [
    { id: "visits", label: "Визит", count: num(r?.visits) },
    { id: "scroll50", label: "Скролл 50%", count: num(r?.scroll50) },
    { id: "works", label: "Посмотрел работы", count: num(r?.works) },
    { id: "form_start", label: "Начал заполнять форму", count: num(r?.form_start) },
    { id: "form_submit", label: "Отправил заявку", count: num(r?.form_submit) },
  ];
}

export async function getRecentLeads(limit = 5) {
  const db = await getDb();
  return db
    .select({
      id: schema.leads.id,
      number: schema.leads.number,
      name: schema.leads.name,
      phone: schema.leads.phone,
      email: schema.leads.email,
      telegram: schema.leads.telegram,
      services: schema.leads.services,
      status: schema.leads.status,
      channel: schema.leads.channel,
      createdAt: schema.leads.createdAt,
    })
    .from(schema.leads)
    .orderBy(desc(schema.leads.createdAt))
    .limit(limit);
}

export async function getOnlineSessions(limit = 12) {
  const db = await getDb();
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  return db
    .select({
      id: schema.sessions.id,
      visitorId: schema.sessions.visitorId,
      startedAt: schema.sessions.startedAt,
      lastSeenAt: schema.sessions.lastSeenAt,
      duration: schema.sessions.duration,
      country: schema.sessions.country,
      city: schema.sessions.city,
      device: schema.sessions.device,
      channel: schema.sessions.channel,
      landingPath: schema.sessions.landingPath,
      maxScroll: schema.sessions.maxScroll,
    })
    .from(schema.sessions)
    .where(gt(schema.sessions.lastSeenAt, since))
    .orderBy(desc(schema.sessions.lastSeenAt))
    .limit(limit);
}

export async function getOnlineCount(): Promise<number> {
  const [r] = await queryRows<Record<string, unknown>>(sql`
    select count(*)::int as count from sessions where last_seen_at > ${tsParam(new Date(Date.now() - ONLINE_WINDOW_MS))}
  `);
  return num(r?.count);
}

export async function getNewLeadsCount(): Promise<number> {
  const [r] = await queryRows<Record<string, unknown>>(sql`select count(*)::int as count from leads where status = 'new'`);
  return num(r?.count);
}
