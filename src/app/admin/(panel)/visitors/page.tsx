import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/server";
import { getChannelOptions, getNewVsReturning, listSessions, ONLINE_WINDOW_MS } from "@/lib/admin/queries";
import { getRange, parsePeriod } from "@/lib/admin/period";
import { channelLabel, countryName, deviceLabel, flagEmoji } from "@/lib/admin/constants";
import { formatDateTime, formatDuration, formatNumber, formatPercent, plural } from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ButtonLink } from "@/components/admin/ui/button";
import { withParams } from "@/components/admin/ui/segmented";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/admin/ui/table";
import { DeviceIcon, IconChevronLeft, IconChevronRight, IconUsers } from "@/components/admin/ui/icons";
import { PeriodSwitcher } from "@/components/admin/period-switcher";
import { VisitorsFilters } from "@/components/admin/visitors/visitors-filters";
import { CHART_COLORS } from "@/lib/admin/constants";

export const metadata: Metadata = { title: "Посетители" };

export default async function VisitorsPage({ searchParams }: PageProps<"/admin/visitors">) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const period = parsePeriod(sp.period, "7d");
  const range = getRange(period);
  const channel = str(sp.channel).slice(0, 60);
  const device = str(sp.device).slice(0, 20);
  const converted = str(sp.converted) === "1";
  const online = str(sp.online) === "1";
  const page = Math.max(1, Math.min(10_000, Number.parseInt(str(sp.page), 10) || 1));

  const [list, summary, channels] = await Promise.all([
    listSessions({ range, channel: channel || null, device: device || null, converted, online, page }),
    getNewVsReturning(range),
    getChannelOptions(),
  ]);
  const onlineSince = range.end.getTime() - ONLINE_WINDOW_MS;
  const newShare = summary.total ? summary.newVisitors / summary.total : 0;

  const pageHref = (p: number) => withParams("/admin/visitors", sp, { page: p > 1 ? String(p) : null });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Посетители"
        description="Визиты на сайт · время Алматы"
        actions={<PeriodSwitcher pathname="/admin/visitors" searchParams={sp} value={period} />}
      />

      <Card className="grid gap-4 p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.6fr)] sm:items-center sm:p-5">
        <Stat label="Посетители" value={formatNumber(summary.total)} />
        <Stat label="Новые" value={formatNumber(summary.newVisitors)} dot={CHART_COLORS[0]} />
        <Stat label="Вернувшиеся" value={formatNumber(summary.returningVisitors)} dot={CHART_COLORS[1]} />
        <div>
          <div className="mb-2 flex justify-between text-[12px] text-dim">
            <span>Новые {formatPercent(newShare, 0)}</span>
            <span>Вернувшиеся {formatPercent(summary.total ? 1 - newShare : 0, 0)}</span>
          </div>
          <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-white/[0.04]">
            {summary.total ? (
              <>
                <div className="h-full rounded-l-full" style={{ width: `${newShare * 100}%`, backgroundColor: CHART_COLORS[0] }} />
                <div className="h-full flex-1 rounded-r-full" style={{ backgroundColor: CHART_COLORS[1] }} />
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <VisitorsFilters
        period={period}
        channel={channel}
        device={device}
        converted={converted}
        online={online}
        channels={channels}
      />

      {list.rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconUsers />}
            title={online ? "Сейчас на сайте никого нет" : "Визитов не найдено"}
            description={online ? "Онлайн — активность за последние 2 минуты." : "Измените период или фильтры."}
          />
        </Card>
      ) : (
        <>
          <p className="text-[12.5px] text-mute">
            {online ? "Онлайн сейчас: " : "Найдено: "}
            <span className="text-dim tabular-nums">{formatNumber(list.total)}</span> {plural(list.total, "визит", "визита", "визитов")}
          </p>

          {/* Mobile */}
          <ul className="space-y-2.5 md:hidden">
            {list.rows.map((s) => {
              const isOnline = new Date(s.lastSeenAt).getTime() > onlineSince;
              return (
                <li key={s.id}>
                  <Link href={`/admin/visitors/${s.id}`} className="block rounded-2xl border border-line bg-carbon p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="text-lg leading-none" aria-hidden>
                          {flagEmoji(s.country)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] text-fg">{[s.city, countryName(s.country)].filter(Boolean).join(", ")}</p>
                          <p className="text-[12px] text-mute">{formatDateTime(s.startedAt)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        {isOnline ? (
                          <Badge tone="ok" dot pulse>
                            Онлайн
                          </Badge>
                        ) : null}
                        {s.converted ? <Badge tone="signal">Заявка</Badge> : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-dim">
                      <span className="inline-flex items-center gap-1">
                        <DeviceIcon device={s.device} size={13} /> {deviceLabel(s.device)}
                      </span>
                      <span>{channelLabel(s.channel)}</span>
                      <span className="tabular-nums">{formatDuration(s.duration)}</span>
                      <span className="tabular-nums">скролл {s.maxScroll}%</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop */}
          <Card className="hidden md:block">
            <TableWrap>
              <Table className="min-w-[1100px]">
                <THead>
                  <tr>
                    <TH>Начало</TH>
                    <TH>Гео</TH>
                    <TH>Устройство</TH>
                    <TH>Браузер / ОС</TH>
                    <TH>Источник</TH>
                    <TH>Вход</TH>
                    <TH className="text-right">Время</TH>
                    <TH className="text-right">Скролл</TH>
                    <TH className="text-right">События</TH>
                    <TH />
                  </tr>
                </THead>
                <tbody>
                  {list.rows.map((s) => {
                    const isOnline = new Date(s.lastSeenAt).getTime() > onlineSince;
                    return (
                      <TR key={s.id} className="relative">
                        <TD className="whitespace-nowrap">
                          <Link href={`/admin/visitors/${s.id}`} className="text-fg after:absolute after:inset-0 hover:text-[#8fb3ff]">
                            {formatDateTime(s.startedAt)}
                          </Link>
                          {s.visits && s.visits > 1 ? <span className="block text-[11.5px] text-mute">{s.visits}-й визит</span> : null}
                        </TD>
                        <TD className="max-w-[200px]">
                          <span className="flex items-center gap-2">
                            <span aria-hidden>{flagEmoji(s.country)}</span>
                            <span className="truncate text-fg">{[s.city, countryName(s.country)].filter(Boolean).join(", ")}</span>
                          </span>
                        </TD>
                        <TD>
                          <span className="inline-flex items-center gap-1.5 text-dim" title={deviceLabel(s.device)}>
                            <DeviceIcon device={s.device} size={15} /> {deviceLabel(s.device)}
                          </span>
                        </TD>
                        <TD className="whitespace-nowrap text-dim">{[s.browser, s.os].filter(Boolean).join(" · ") || "—"}</TD>
                        <TD className="whitespace-nowrap text-dim">
                          {channelLabel(s.channel)}
                          {s.referrerHost && s.channel === "referral" ? <span className="block text-[11.5px] text-mute">{s.referrerHost}</span> : null}
                        </TD>
                        <TD className="max-w-[160px] truncate font-mono text-[12px] text-dim">{s.landingPath ?? "—"}</TD>
                        <TD className="text-right whitespace-nowrap text-fg tabular-nums">{formatDuration(s.duration)}</TD>
                        <TD className="text-right text-fg tabular-nums">{s.maxScroll}%</TD>
                        <TD className="text-right text-dim tabular-nums">{s.events}</TD>
                        <TD>
                          <div className="flex justify-end gap-1.5">
                            {isOnline ? (
                              <Badge tone="ok" dot pulse>
                                Онлайн
                              </Badge>
                            ) : null}
                            {s.converted ? <Badge tone="signal">Заявка</Badge> : null}
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          </Card>

          {list.pageCount > 1 ? (
            <nav className="flex items-center justify-between gap-3" aria-label="Страницы">
              <span className="text-[12.5px] text-mute tabular-nums">
                Стр. {list.page} из {list.pageCount}
              </span>
              <div className="flex gap-2">
                <ButtonLink
                  href={pageHref(list.page - 1)}
                  variant="secondary"
                  size="sm"
                  aria-disabled={list.page <= 1}
                  tabIndex={list.page <= 1 ? -1 : undefined}
                >
                  <IconChevronLeft size={15} /> Назад
                </ButtonLink>
                <ButtonLink
                  href={pageHref(list.page + 1)}
                  variant="secondary"
                  size="sm"
                  aria-disabled={list.page >= list.pageCount}
                  tabIndex={list.page >= list.pageCount ? -1 : undefined}
                >
                  Вперёд <IconChevronRight size={15} />
                </ButtonLink>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[12.5px] text-dim">
        {dot ? <span className="size-2 rounded-[3px]" style={{ backgroundColor: dot }} /> : null}
        {label}
      </p>
      <p className="mt-1 font-display text-[22px] leading-none font-medium tracking-[-0.02em] text-fg tabular-nums">{value}</p>
    </div>
  );
}
