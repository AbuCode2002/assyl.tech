import { after, NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { leadInputSchema } from "@/lib/lead-schema";
import { getClientInfo } from "@/lib/server/request-info";
import { rateLimit } from "@/lib/server/rate-limit";
import { formatLeadMessage, sendTelegram } from "@/lib/server/telegram";

const BUDGET_LABELS: Record<string, string> = {
  lt1m: "до 1 млн ₸",
  "1to3m": "1–3 млн ₸",
  "3to7m": "3–7 млн ₸",
  gt7m: "7+ млн ₸",
  unknown: "не определён",
};
const TIMELINE_LABELS: Record<string, string> = {
  asap: "срочно",
  "1to3": "1–3 месяца",
  "3to6": "3–6 месяцев",
  flex: "гибко",
};

export async function POST(req: NextRequest) {
  const client = await getClientInfo(req.headers);
  if (!rateLimit(`lead:${client.ipHash ?? "anon"}`, 5, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation", fields: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // Bots: filled honeypot or submitted faster than a human could type.
  if (input.website || (input.startedAt && Date.now() - input.startedAt < 2500)) {
    return NextResponse.json({ ok: true, number: 0 });
  }

  const db = await getDb();

  let session: typeof schema.sessions.$inferSelect | undefined;
  if (input.sessionId) {
    [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, input.sessionId)).limit(1);
  }

  const utm = session
    ? Object.fromEntries(
        Object.entries({
          source: session.utmSource,
          medium: session.utmMedium,
          campaign: session.utmCampaign,
          content: session.utmContent,
          term: session.utmTerm,
        }).filter(([, v]) => v),
      )
    : undefined;

  const [lead] = await db
    .insert(schema.leads)
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email,
      telegram: input.telegram,
      company: input.company,
      services: input.services,
      budget: input.budget ? BUDGET_LABELS[input.budget] : undefined,
      timeline: input.timeline ? TIMELINE_LABELS[input.timeline] : undefined,
      message: input.message,
      locale: input.locale,
      visitorId: input.visitorId,
      sessionId: session ? session.id : undefined,
      channel: session?.channel ?? "direct",
      utm: utm && Object.keys(utm).length ? (utm as Record<string, string>) : undefined,
      page: input.page,
      country: client.country ?? session?.country,
      city: client.city ?? session?.city,
      device: client.device,
      userAgent: client.userAgent,
      ipHash: client.ipHash,
    })
    .returning();

  if (session) {
    await db
      .update(schema.sessions)
      .set({ converted: true, events: sql`${schema.sessions.events} + 1`, lastSeenAt: new Date() })
      .where(eq(schema.sessions.id, session.id));
    await db.insert(schema.events).values({
      sessionId: session.id,
      visitorId: session.visitorId,
      type: "form_submit",
      name: "lead",
      path: input.page,
      data: { leadId: lead!.id, number: lead!.number },
    });
    await db.update(schema.visitors).set({ leadId: lead!.id }).where(eq(schema.visitors.id, session.visitorId));
  }

  after(async () => {
    const result = await sendTelegram(formatLeadMessage(lead!, process.env.NEXT_PUBLIC_SITE_URL));
    if (!result.ok && result.error !== "Telegram не настроен") console.error("[telegram]", result.error);
  });

  return NextResponse.json({ ok: true, number: lead!.number });
}
