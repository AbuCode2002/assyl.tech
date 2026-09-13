import "server-only";
import { and, count, desc, eq, gt, gte, lt, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { inRange, num, ONLINE_WINDOW_MS, queryRows, tsParam, type RangeInput } from "./sql";

export const SESSIONS_PAGE_SIZE = 25;

export type SessionFilters = {
  range: RangeInput;
  channel?: string | null;
  device?: string | null;
  converted?: boolean;
  online?: boolean;
  page: number;
};

function buildSessionWhere(f: SessionFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [
    gte(schema.sessions.startedAt, f.range.start),
    lt(schema.sessions.startedAt, f.range.end),
  ];
  if (f.channel) conds.push(eq(schema.sessions.channel, f.channel));
  if (f.device) conds.push(eq(schema.sessions.device, f.device));
  if (f.converted) conds.push(eq(schema.sessions.converted, true));
  if (f.online) {
    // online sessions may have started before the selected period
    conds.splice(0, 2);
    conds.push(gt(schema.sessions.lastSeenAt, new Date(Date.now() - ONLINE_WINDOW_MS)));
  }
  return and(...conds);
}

export async function listSessions(f: SessionFilters) {
  const db = await getDb();
  const where = buildSessionWhere(f);
  const page = Math.max(1, f.page);
  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: schema.sessions.id,
        visitorId: schema.sessions.visitorId,
        startedAt: schema.sessions.startedAt,
        lastSeenAt: schema.sessions.lastSeenAt,
        duration: schema.sessions.duration,
        events: schema.sessions.events,
        pageviews: schema.sessions.pageviews,
        maxScroll: schema.sessions.maxScroll,
        channel: schema.sessions.channel,
        referrerHost: schema.sessions.referrerHost,
        landingPath: schema.sessions.landingPath,
        locale: schema.sessions.locale,
        country: schema.sessions.country,
        city: schema.sessions.city,
        device: schema.sessions.device,
        browser: schema.sessions.browser,
        os: schema.sessions.os,
        converted: schema.sessions.converted,
        visits: schema.visitors.visits,
      })
      .from(schema.sessions)
      .leftJoin(schema.visitors, eq(schema.visitors.id, schema.sessions.visitorId))
      .where(where)
      .orderBy(desc(schema.sessions.startedAt))
      .limit(SESSIONS_PAGE_SIZE)
      .offset((page - 1) * SESSIONS_PAGE_SIZE),
    db.select({ value: count() }).from(schema.sessions).where(where),
  ]);
  return { rows, total: num(total?.value), page, pageCount: Math.max(1, Math.ceil(num(total?.value) / SESSIONS_PAGE_SIZE)) };
}

export type SessionListItem = Awaited<ReturnType<typeof listSessions>>["rows"][number];

export type NewReturning = { newVisitors: number; returningVisitors: number; total: number };

/**
 * Returning = active in the period and has more than one visit so far (earlier or within the period);
 * new = everyone else active in the period (exactly one visit, first seen inside the period).
 */
export async function getNewVsReturning(range: RangeInput): Promise<NewReturning> {
  const [r] = await queryRows<Record<string, unknown>>(sql`
    with v as (
      select visitor_id, count(*) as period_sessions
      from sessions where ${inRange("started_at", range.start, range.end)}
      group by visitor_id
    ), h as (
      select v.visitor_id, v.period_sessions,
        (select count(*) from sessions s where s.visitor_id = v.visitor_id and s.started_at < ${tsParam(range.start)}) as earlier_sessions
      from v
    )
    select
      count(*) filter (where period_sessions + earlier_sessions <= 1)::int as new_visitors,
      count(*) filter (where period_sessions + earlier_sessions > 1)::int as returning_visitors
    from h
  `);
  const newVisitors = num(r?.new_visitors);
  const returningVisitors = num(r?.returning_visitors);
  return { newVisitors, returningVisitors, total: newVisitors + returningVisitors };
}

export async function getChannelOptions(): Promise<string[]> {
  const rows = await queryRows<Record<string, unknown>>(sql`
    select channel from sessions group by channel order by count(*) desc limit 40
  `);
  return rows.map((r) => String(r.channel));
}

export async function getVisitor(id: string) {
  const db = await getDb();
  const [visitor] = await db.select().from(schema.visitors).where(eq(schema.visitors.id, id)).limit(1);
  return visitor ?? null;
}

/** Leads tied to this session or to the visitor. */
export async function getLeadsForVisitor(visitorId: string, sessionId?: string) {
  const db = await getDb();
  return db
    .select({
      id: schema.leads.id,
      number: schema.leads.number,
      name: schema.leads.name,
      status: schema.leads.status,
      createdAt: schema.leads.createdAt,
      sessionId: schema.leads.sessionId,
    })
    .from(schema.leads)
    .where(
      sessionId
        ? or(eq(schema.leads.visitorId, visitorId), eq(schema.leads.sessionId, sessionId))
        : eq(schema.leads.visitorId, visitorId),
    )
    .orderBy(desc(schema.leads.createdAt))
    .limit(10);
}
