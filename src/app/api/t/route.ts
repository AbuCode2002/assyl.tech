import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { classifyChannel, getClientInfo } from "@/lib/server/request-info";
import { rateLimit } from "@/lib/server/rate-limit";

const id = z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/);
const str = (max: number) => z.string().max(max).optional();

const payloadSchema = z.object({
  v: id,
  s: id,
  t: z.enum(["pageview", "ping", "section", "click", "scroll", "form_start", "video", "locale"]),
  n: str(80),
  p: str(300),
  l: str(8),
  r: str(600),
  u: z
    .object({ source: str(80), medium: str(80), campaign: str(120), content: str(120), term: str(120) })
    .partial()
    .optional(),
  sc: str(20),
  lang: str(20),
  /** active seconds since session start */
  dur: z.number().int().min(0).max(86_400).optional(),
  /** scroll depth 0..100 */
  sd: z.number().int().min(0).max(100).optional(),
  d: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
});

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  const client = await getClientInfo(req.headers);
  if (client.isBot) return noContent();

  // sendBeacon posts text/plain, so parse manually
  const raw = await req.text().catch(() => "");
  if (raw.length > 4000) return noContent();
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return noContent();
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) return noContent();
  const e = parsed.data;
  if (e.p?.startsWith("/admin")) return noContent();
  if (!rateLimit(`t:${e.v}`, 240, 60_000)) return noContent();

  const db = await getDb();
  const now = new Date();

  const [existing] = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(eq(schema.sessions.id, e.s))
    .limit(1);

  if (!existing) {
    let referrerHost: string | null = null;
    try {
      referrerHost = e.r ? new URL(e.r).hostname.replace(/^www\./, "") : null;
    } catch {}
    const ownHost = req.nextUrl.hostname.replace(/^www\./, "");
    const channel = classifyChannel(referrerHost, e.u?.source ?? null, ownHost);

    const [visitor] = await db
      .insert(schema.visitors)
      .values({
        id: e.v,
        country: client.country,
        city: client.city,
        device: client.device,
        browser: client.browser,
        os: client.os,
        language: e.lang,
      })
      .onConflictDoUpdate({
        target: schema.visitors.id,
        set: {
          lastSeenAt: now,
          visits: sql`${schema.visitors.visits} + 1`,
          country: client.country ?? sql`${schema.visitors.country}`,
          city: client.city ?? sql`${schema.visitors.city}`,
        },
      })
      .returning({ id: schema.visitors.id });

    await db
      .insert(schema.sessions)
      .values({
        id: e.s,
        visitorId: visitor!.id,
        referrer: referrerHost === ownHost ? null : e.r,
        referrerHost: referrerHost === ownHost ? null : referrerHost,
        channel,
        utmSource: e.u?.source,
        utmMedium: e.u?.medium,
        utmCampaign: e.u?.campaign,
        utmContent: e.u?.content,
        utmTerm: e.u?.term,
        landingPath: e.p,
        locale: e.l,
        country: client.country,
        city: client.city,
        device: client.device,
        browser: client.browser,
        os: client.os,
        screen: e.sc,
        ipHash: client.ipHash,
      })
      .onConflictDoNothing();
  }

  const isPageview = e.t === "pageview";
  await db
    .update(schema.sessions)
    .set({
      lastSeenAt: now,
      ...(e.dur !== undefined ? { duration: sql`greatest(${schema.sessions.duration}, ${e.dur})` } : {}),
      ...(e.sd !== undefined ? { maxScroll: sql`greatest(${schema.sessions.maxScroll}, ${e.sd})` } : {}),
      ...(isPageview ? { pageviews: sql`${schema.sessions.pageviews} + 1` } : {}),
      ...(e.t !== "ping" ? { events: sql`${schema.sessions.events} + 1` } : {}),
    })
    .where(eq(schema.sessions.id, e.s));

  if (isPageview) {
    await db
      .update(schema.visitors)
      .set({ lastSeenAt: now, pageviews: sql`${schema.visitors.pageviews} + 1` })
      .where(eq(schema.visitors.id, e.v));
  } else if (e.t === "ping") {
    await db.update(schema.visitors).set({ lastSeenAt: now }).where(eq(schema.visitors.id, e.v));
  }

  if (e.t !== "ping") {
    await db.insert(schema.events).values({
      sessionId: e.s,
      visitorId: e.v,
      type: e.t,
      name: e.n,
      path: e.p,
      data: e.d,
    });
  }

  return noContent();
}
