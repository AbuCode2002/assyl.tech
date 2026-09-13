import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/server";
import {
  getDurationByChannel,
  getLocales,
  getNewVsReturning,
  getReferrerHosts,
  getScrollDepth,
  getSectionEngagement,
  getTopClicks,
  getUtmCampaigns,
  getWeekdayHourHeatmap,
} from "@/lib/admin/queries";
import { getRange, parsePeriod } from "@/lib/admin/period";
import { CHART_COLORS, channelLabel, clickLabel, LOCALE_LABELS, SECTION_LABELS } from "@/lib/admin/constants";
import { formatDuration, formatNumber, formatPercent, plural } from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/admin/ui/table";
import { IconChart } from "@/components/admin/ui/icons";
import { PeriodSwitcher } from "@/components/admin/period-switcher";
import { BarList } from "@/components/admin/charts/bar-list";
import { SegmentedBar } from "@/components/admin/charts/segmented-bar";
import { WeekHourHeatmap } from "@/components/admin/charts/heatmap";

export const metadata: Metadata = { title: "Аналитика" };

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  await requireAdmin();
  const sp = await searchParams;
  const period = parsePeriod(sp.period, "30d");
  const range = getRange(period);

  const [sections, clicks, scroll, heatmap, utm, hosts, locales, byChannel, newReturning] = await Promise.all([
    getSectionEngagement(range),
    getTopClicks(range),
    getScrollDepth(range),
    getWeekdayHourHeatmap(range),
    getUtmCampaigns(range),
    getReferrerHosts(range),
    getLocales(range),
    getDurationByChannel(range),
    getNewVsReturning(range),
  ]);
  const total = sections.total;
  const empty = <EmptyState compact title="Нет данных за период" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Аналитика"
        description="Поведение посетителей на лендинге · время Алматы"
        actions={<PeriodSwitcher pathname="/admin/analytics" searchParams={sp} value={period} />}
      />

      {total === 0 ? (
        <Card>
          <EmptyState icon={<IconChart />} title="За этот период визитов нет" description="Выберите другой период или дождитесь первых посетителей." />
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Вовлечённость по блокам" description="Доля визитов, в которых блок попал в экран — в порядке на странице" />
          <CardBody>
            {total ? (
              <BarList
                total={total}
                scaleTo={total}
                items={sections.rows.map((s, i) => ({
                  key: s.id,
                  label: (
                    <span>
                      <span className="mr-2 font-mono text-[11px] text-mute">{String(i + 1).padStart(2, "0")}</span>
                      {SECTION_LABELS[s.id] ?? s.id}
                    </span>
                  ),
                  value: s.sessions,
                }))}
              />
            ) : (
              empty
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Глубина скролла" description="Доля визитов, прокрутивших страницу хотя бы до отметки" />
          <CardBody>
            {scroll.total ? (
              <BarList
                total={scroll.total}
                scaleTo={scroll.total}
                items={scroll.steps.map((s) => ({ key: String(s.depth), label: `Дочитали до ${s.depth}%`, value: s.sessions }))}
              />
            ) : (
              empty
            )}
            {scroll.total ? (
              <div className="mt-6 border-t border-line pt-4">
                <p className="mono-label mb-3 text-mute">Новые и вернувшиеся</p>
                <SegmentedBar
                  segments={[
                    { key: "new", label: "Новые посетители", value: newReturning.newVisitors },
                    { key: "returning", label: "Вернувшиеся", value: newReturning.returningVisitors },
                  ]}
                />
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Когда заходят" description="Визиты по дням недели и часам (Алматы)" />
        <CardBody>{total ? <WeekHourHeatmap grid={heatmap} /> : empty}</CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Клики" description="Кнопки и ссылки с разметкой трекинга" />
          <CardBody>
            {clicks.length ? (
              <BarList
                showShare={false}
                items={clicks.map((c) => ({
                  key: c.name,
                  label: clickLabel(c.name),
                  title: c.name,
                  value: c.clicks,
                  extra: `${formatNumber(c.sessions)} ${plural(c.sessions, "визит", "визита", "визитов")}`,
                }))}
              />
            ) : (
              empty
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Время на сайте по каналам" description="Среднее активное время визита" />
          <CardBody>
            {byChannel.length ? (
              <BarList
                showShare={false}
                valueFormatter={formatDuration}
                items={byChannel.slice(0, 10).map((c) => ({
                  key: c.channel,
                  label: channelLabel(c.channel),
                  value: c.avgDuration,
                  extra: `${formatNumber(c.sessions)} виз. · конв. ${formatPercent(c.conversion, 1)}`,
                }))}
              />
            ) : (
              empty
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="UTM-кампании" description="Визиты с utm-метками и заявки по ним" />
        {utm.length ? (
          <TableWrap>
            <Table className="min-w-[640px]">
              <THead>
                <tr>
                  <TH>Source</TH>
                  <TH>Medium</TH>
                  <TH>Campaign</TH>
                  <TH className="text-right">Визиты</TH>
                  <TH className="text-right">Заявки</TH>
                  <TH className="text-right">Конверсия</TH>
                </tr>
              </THead>
              <tbody>
                {utm.map((u) => (
                  <TR key={`${u.source}|${u.medium}|${u.campaign}`}>
                    <TD className="font-mono text-[12px] text-fg">{u.source}</TD>
                    <TD className="font-mono text-[12px] text-dim">{u.medium ?? "—"}</TD>
                    <TD className="font-mono text-[12px] text-dim">{u.campaign ?? "—"}</TD>
                    <TD className="text-right text-fg tabular-nums">{formatNumber(u.sessions)}</TD>
                    <TD className="text-right text-fg tabular-nums">{formatNumber(u.leads)}</TD>
                    <TD className="text-right text-dim tabular-nums">{formatPercent(u.sessions ? u.leads / u.sessions : 0, 1)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState
            compact
            title="Нет визитов с UTM-метками"
            description="Добавляйте ?utm_source=instagram&utm_medium=bio&utm_campaign=… к ссылкам в рекламе и соцсетях"
          />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Сайты-источники" description="Домены, с которых перешли на сайт" />
          <CardBody>
            {hosts.length ? (
              <BarList
                items={hosts.map((h) => ({
                  key: h.host,
                  label: <span className="font-mono text-[12.5px]">{h.host}</span>,
                  value: h.sessions,
                  extra: h.leads ? `${h.leads} ${plural(h.leads, "заявка", "заявки", "заявок")}` : undefined,
                }))}
              />
            ) : (
              empty
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Языки сайта" description="Версия сайта, на которой был визит" />
          <CardBody>
            {locales.length ? (
              <SegmentedBar
                segments={locales.map((l) => ({
                  key: l.locale,
                  label: LOCALE_LABELS[l.locale] ?? l.locale,
                  value: l.sessions,
                  // colour follows the entity, not its rank
                  color: CHART_COLORS[({ ru: 0, kz: 1, en: 2 } as Record<string, number>)[l.locale] ?? 3],
                }))}
              />
            ) : (
              empty
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
