import "server-only";
import { sql } from "drizzle-orm";
import { SECTION_ORDER } from "@/lib/admin/constants";
import { ALMATY, inRange, num, queryRows, type RangeInput } from "./sql";

export type SectionRow = { id: string; sessions: number; share: number };

export async function getSectionEngagement(range: RangeInput): Promise<{ total: number; rows: SectionRow[] }> {
  const where = inRange("s.started_at", range.start, range.end);
  const [[totalRow], rows] = await Promise.all([
    queryRows<Record<string, unknown>>(sql`select count(*)::int as total from sessions s where ${where}`),
    queryRows<Record<string, unknown>>(sql`
      select e.name, count(distinct e.session_id)::int as sessions
      from events e join sessions s on s.id = e.session_id
      where ${where} and e.type = 'section'
      group by e.name
    `),
  ]);
  const total = num(totalRow?.total);
  const byName = new Map(rows.map((r) => [String(r.name), num(r.sessions)]));
  const ordered: SectionRow[] = SECTION_ORDER.map((id) => {
    const sessions = byName.get(id) ?? 0;
    return { id, sessions, share: total ? sessions / total : 0 };
  });
  // unknown sections (added to the landing later) go after the known ones
  for (const [id, sessions] of byName) {
    if (!(SECTION_ORDER as readonly string[]).includes(id)) ordered.push({ id, sessions, share: total ? sessions / total : 0 });
  }
  return { total, rows: ordered };
}

export type ClickRow = { name: string; clicks: number; sessions: number };

export async function getTopClicks(range: RangeInput, limit = 15): Promise<ClickRow[]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select e.name, count(*)::int as clicks, count(distinct e.session_id)::int as sessions
    from events e join sessions s on s.id = e.session_id
    where ${inRange("s.started_at", range.start, range.end)} and e.type = 'click' and e.name is not null
    group by e.name
    order by clicks desc
    limit ${limit}
  `);
  return rows.map((r) => ({ name: String(r.name), clicks: num(r.clicks), sessions: num(r.sessions) }));
}

export type ScrollDepth = { total: number; steps: { depth: number; sessions: number }[] };

export async function getScrollDepth(range: RangeInput): Promise<ScrollDepth> {
  const [r] = await queryRows<Record<string, unknown>>(sql`
    select count(*)::int as total,
      count(*) filter (where max_scroll >= 25)::int as d25,
      count(*) filter (where max_scroll >= 50)::int as d50,
      count(*) filter (where max_scroll >= 75)::int as d75,
      count(*) filter (where max_scroll >= 100)::int as d100
    from sessions where ${inRange("started_at", range.start, range.end)}
  `);
  return {
    total: num(r?.total),
    steps: [25, 50, 75, 100].map((depth) => ({ depth, sessions: num(r?.[`d${depth}`]) })),
  };
}

/** 7 × 24 matrix, index [isoWeekday-1][hour], Almaty time. */
export async function getWeekdayHourHeatmap(range: RangeInput): Promise<number[][]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select extract(isodow from started_at at time zone ${ALMATY})::int as dow,
           extract(hour from started_at at time zone ${ALMATY})::int as hour,
           count(*)::int as count
    from sessions
    where ${inRange("started_at", range.start, range.end)}
    group by 1, 2
  `);
  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const r of rows) {
    const d = num(r.dow) - 1;
    const h = num(r.hour);
    if (d >= 0 && d < 7 && h >= 0 && h < 24) grid[d]![h] = num(r.count);
  }
  return grid;
}

export type UtmRow = { source: string; medium: string | null; campaign: string | null; sessions: number; leads: number };

export async function getUtmCampaigns(range: RangeInput, limit = 20): Promise<UtmRow[]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select utm_source, utm_medium, utm_campaign,
           count(*)::int as sessions,
           count(*) filter (where converted)::int as leads
    from sessions
    where ${inRange("started_at", range.start, range.end)} and utm_source is not null
    group by utm_source, utm_medium, utm_campaign
    order by sessions desc
    limit ${limit}
  `);
  return rows.map((r) => ({
    source: String(r.utm_source),
    medium: (r.utm_medium as string | null) ?? null,
    campaign: (r.utm_campaign as string | null) ?? null,
    sessions: num(r.sessions),
    leads: num(r.leads),
  }));
}

export type HostRow = { host: string; sessions: number; leads: number };

export async function getReferrerHosts(range: RangeInput, limit = 12): Promise<HostRow[]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select referrer_host, count(*)::int as sessions, count(*) filter (where converted)::int as leads
    from sessions
    where ${inRange("started_at", range.start, range.end)} and referrer_host is not null
    group by referrer_host
    order by sessions desc
    limit ${limit}
  `);
  return rows.map((r) => ({ host: String(r.referrer_host), sessions: num(r.sessions), leads: num(r.leads) }));
}

export type LocaleRow = { locale: string; sessions: number };

export async function getLocales(range: RangeInput): Promise<LocaleRow[]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select coalesce(locale, 'ru') as locale, count(*)::int as sessions
    from sessions
    where ${inRange("started_at", range.start, range.end)}
    group by 1
    order by sessions desc
  `);
  return rows.map((r) => ({ locale: String(r.locale), sessions: num(r.sessions) }));
}

export type ChannelDurationRow = { channel: string; sessions: number; avgDuration: number; avgScroll: number; conversion: number };

export async function getDurationByChannel(range: RangeInput): Promise<ChannelDurationRow[]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select channel, count(*)::int as sessions,
           coalesce(avg(duration), 0)::float8 as avg_duration,
           coalesce(avg(max_scroll), 0)::float8 as avg_scroll,
           (count(*) filter (where converted))::float8 / nullif(count(*), 0) as conversion
    from sessions
    where ${inRange("started_at", range.start, range.end)}
    group by channel
    order by sessions desc
  `);
  return rows.map((r) => ({
    channel: String(r.channel),
    sessions: num(r.sessions),
    avgDuration: num(r.avg_duration),
    avgScroll: num(r.avg_scroll),
    conversion: num(r.conversion),
  }));
}
