import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import {
  getLeadsForVisitor,
  getSessionById,
  getSessionEvents,
  getVisitor,
  getVisitorSessions,
  onlineSinceMs,
} from "@/lib/admin/queries";
import { channelLabel, countryName, deviceLabel, flagEmoji, LOCALE_LABELS } from "@/lib/admin/constants";
import { formatDateTime, formatDuration, formatFullDateTime, formatNumber } from "@/lib/admin/format";
import { Card, CardBody, CardHeader, InfoRow } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { DeviceIcon, IconArrowLeft, IconInbox, IconSpark } from "@/components/admin/ui/icons";
import { EventTimeline, SessionsList } from "@/components/admin/journey";

export const metadata: Metadata = { title: "Визит" };

export default async function SessionDetailPage({ params }: PageProps<"/admin/visitors/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) notFound();

  const session = await getSessionById(id);
  if (!session) notFound();

  const [events, visitor, sessions, leads] = await Promise.all([
    getSessionEvents(session.id),
    getVisitor(session.visitorId),
    getVisitorSessions(session.visitorId),
    getLeadsForVisitor(session.visitorId, session.id),
  ]);
  const onlineSince = onlineSinceMs();
  const isOnline = new Date(session.lastSeenAt).getTime() > onlineSince;
  const geo = [session.city, countryName(session.country)].filter(Boolean).join(", ");
  const utm = [
    ["utm_source", session.utmSource],
    ["utm_medium", session.utmMedium],
    ["utm_campaign", session.utmCampaign],
    ["utm_content", session.utmContent],
    ["utm_term", session.utmTerm],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="space-y-5">
      <Link href="/admin/visitors" className="inline-flex items-center gap-1.5 text-[13px] text-dim hover:text-fg">
        <IconArrowLeft size={15} /> Посетители
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isOnline ? (
              <Badge tone="ok" dot pulse>
                Онлайн
              </Badge>
            ) : null}
            {session.converted ? <Badge tone="signal">Заявка</Badge> : null}
            {visitor && visitor.visits > 1 ? <Badge>Вернувшийся · {visitor.visits} визитов</Badge> : <Badge>Новый посетитель</Badge>}
          </div>
          <h1 className="flex items-center gap-3 font-display text-[22px] leading-tight font-medium tracking-[-0.02em] text-fg sm:text-[28px]">
            <span aria-hidden className="text-[0.9em]">
              {flagEmoji(session.country)}
            </span>
            <span className="min-w-0 break-words">{geo}</span>
          </h1>
          <p className="mt-1.5 text-[13px] text-dim">{formatFullDateTime(session.startedAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Активное время" value={formatDuration(session.duration)} />
        <MiniStat label="Скролл" value={`${session.maxScroll}%`} />
        <MiniStat label="События" value={formatNumber(session.events)} />
        <MiniStat label="Просмотры" value={formatNumber(session.pageviews)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Хронология визита" description="Время от начала визита" />
            <CardBody>
              {events.length ? (
                <EventTimeline events={events} startedAt={session.startedAt} />
              ) : (
                <EmptyState compact icon={<IconSpark />} title="Событий нет" />
              )}
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Все визиты посетителя" description={visitor ? `Впервые на сайте ${formatDateTime(visitor.firstSeenAt)}` : undefined} />
            <SessionsList sessions={sessions} currentId={session.id} onlineSince={onlineSince} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader title="Заявки" />
            {leads.length ? (
              <ul className="divide-y divide-line">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/leads/${l.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-graphite/60">
                      <span className="font-mono text-[12px] text-mute">#{l.number}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-fg">{l.name}</p>
                        <p className="text-[12px] text-mute">
                          {formatDateTime(l.createdAt)}
                          {l.sessionId === session.id ? " · в этом визите" : ""}
                        </p>
                      </div>
                      <StatusBadge status={l.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={<IconInbox />} title="Заявок не оставлял" />
            )}
          </Card>

          <Card>
            <CardHeader title="Источник" />
            <CardBody>
              <dl>
                <InfoRow label="Канал">{channelLabel(session.channel)}</InfoRow>
                {session.referrerHost ? <InfoRow label="Реферер">{session.referrerHost}</InfoRow> : null}
                {utm.map(([k, v]) => (
                  <InfoRow key={k} label={k}>
                    <span className="font-mono text-[12px]">{v}</span>
                  </InfoRow>
                ))}
                <InfoRow label="Страница входа">
                  <span className="font-mono text-[12px]">{session.landingPath ?? "—"}</span>
                </InfoRow>
                <InfoRow label="Язык сайта">{LOCALE_LABELS[session.locale ?? ""] ?? session.locale ?? "—"}</InfoRow>
              </dl>
              {session.referrer ? (
                <p className="mt-3 rounded-lg bg-graphite/60 px-3 py-2 font-mono text-[11px] break-all text-mute">{session.referrer}</p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Гео и устройство" />
            <CardBody>
              <dl>
                <InfoRow label="Страна">
                  <span aria-hidden>{flagEmoji(session.country)}</span> {countryName(session.country)}
                </InfoRow>
                <InfoRow label="Город">{session.city ?? "—"}</InfoRow>
                <InfoRow label="Устройство">
                  <span className="inline-flex items-center gap-1.5">
                    <DeviceIcon device={session.device} size={14} /> {deviceLabel(session.device)}
                  </span>
                </InfoRow>
                <InfoRow label="Браузер">{session.browser ?? "—"}</InfoRow>
                <InfoRow label="ОС">{session.os ?? "—"}</InfoRow>
                <InfoRow label="Экран">{session.screen ?? "—"}</InfoRow>
                <InfoRow label="Язык браузера">{visitor?.language ?? "—"}</InfoRow>
                <InfoRow label="Последняя активность">{formatDateTime(session.lastSeenAt)}</InfoRow>
              </dl>
              <p className="mt-3 font-mono text-[10.5px] break-all text-mute">ID {session.visitorId}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-carbon p-4">
      <p className="text-[12.5px] text-dim">{label}</p>
      <p className="mt-2 font-display text-[20px] leading-none font-medium tracking-[-0.02em] text-fg tabular-nums">{value}</p>
    </div>
  );
}
