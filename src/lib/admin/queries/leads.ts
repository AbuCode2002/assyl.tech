import "server-only";
import { and, asc, desc, eq, gte, ilike, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { LeadStatus } from "@/lib/db/schema";
import { getRange, type PeriodId } from "@/lib/admin/period";
import { isUuid, num, queryRows } from "./sql";

export type LeadFilters = {
  status?: LeadStatus | null;
  q?: string | null;
  period?: PeriodId | "all";
};

export function buildLeadWhere(filters: LeadFilters): SQL | undefined {
  const conds: SQL[] = [];
  if (filters.status) conds.push(eq(schema.leads.status, filters.status));
  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const digits = q.replace(/\D/g, "");
    const byText = or(
      ilike(schema.leads.name, pattern),
      ilike(schema.leads.phone, pattern),
      ilike(schema.leads.email, pattern),
      ilike(schema.leads.telegram, pattern),
      ilike(schema.leads.company, pattern),
      ...(digits.length >= 3
        ? [sql`regexp_replace(coalesce(${schema.leads.phone}, ''), '\\D', '', 'g') like ${`%${digits}%`}`]
        : []),
      ...(/^#?\d{1,9}$/.test(q) ? [eq(schema.leads.number, Number(q.replace("#", "")))] : []),
    );
    if (byText) conds.push(byText);
  }
  if (filters.period && filters.period !== "all") {
    conds.push(gte(schema.leads.createdAt, getRange(filters.period).start));
  }
  return conds.length ? and(...conds) : undefined;
}

export async function listLeads(filters: LeadFilters, limit = 500) {
  const db = await getDb();
  return db
    .select()
    .from(schema.leads)
    .where(buildLeadWhere(filters))
    .orderBy(desc(schema.leads.createdAt))
    .limit(limit);
}

export type LeadListItem = Awaited<ReturnType<typeof listLeads>>[number];

export async function countLeadsByStatus(): Promise<Record<LeadStatus, number>> {
  const rows = await queryRows<Record<string, unknown>>(sql`select status, count(*)::int as count from leads group by status`);
  const out: Record<LeadStatus, number> = { new: 0, in_progress: 0, proposal: 0, won: 0, lost: 0, spam: 0 };
  for (const r of rows) out[r.status as LeadStatus] = num(r.count);
  return out;
}

export async function getLead(id: string) {
  if (!isUuid(id)) return null;
  const db = await getDb();
  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
  return lead ?? null;
}

export async function getLeadNotes(leadId: string) {
  const db = await getDb();
  return db
    .select({
      id: schema.leadNotes.id,
      kind: schema.leadNotes.kind,
      body: schema.leadNotes.body,
      createdAt: schema.leadNotes.createdAt,
      authorName: schema.admins.name,
      authorEmail: schema.admins.email,
    })
    .from(schema.leadNotes)
    .leftJoin(schema.admins, eq(schema.admins.id, schema.leadNotes.authorId))
    .where(eq(schema.leadNotes.leadId, leadId))
    .orderBy(desc(schema.leadNotes.createdAt));
}

export async function getSessionById(id: string) {
  const db = await getDb();
  const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1);
  return session ?? null;
}

export async function getSessionEvents(sessionId: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.events)
    .where(eq(schema.events.sessionId, sessionId))
    .orderBy(asc(schema.events.createdAt), asc(schema.events.id))
    .limit(1000);
}

export async function getVisitorSessions(visitorId: string, excludeSessionId?: string | null) {
  const db = await getDb();
  return db
    .select({
      id: schema.sessions.id,
      startedAt: schema.sessions.startedAt,
      lastSeenAt: schema.sessions.lastSeenAt,
      duration: schema.sessions.duration,
      events: schema.sessions.events,
      maxScroll: schema.sessions.maxScroll,
      channel: schema.sessions.channel,
      device: schema.sessions.device,
      landingPath: schema.sessions.landingPath,
      converted: schema.sessions.converted,
    })
    .from(schema.sessions)
    .where(
      excludeSessionId
        ? and(eq(schema.sessions.visitorId, visitorId), ne(schema.sessions.id, excludeSessionId))
        : eq(schema.sessions.visitorId, visitorId),
    )
    .orderBy(desc(schema.sessions.startedAt))
    .limit(50);
}

/** The lead's linked session (or the visitor's latest session), its events and other visits. */
export async function getLeadJourney(lead: { sessionId: string | null; visitorId: string | null }) {
  let session = lead.sessionId ? await getSessionById(lead.sessionId) : null;
  if (!session && lead.visitorId) {
    const db = await getDb();
    [session] = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.visitorId, lead.visitorId))
      .orderBy(desc(schema.sessions.startedAt))
      .limit(1);
    session ??= null;
  }
  const visitorId = session?.visitorId ?? lead.visitorId;
  const [events, otherSessions] = await Promise.all([
    session ? getSessionEvents(session.id) : Promise.resolve([]),
    visitorId ? getVisitorSessions(visitorId, session?.id) : Promise.resolve([]),
  ]);
  return { session, events, otherSessions };
}
