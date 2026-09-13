import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/server";
import {
  getChannels,
  getDevices,
  getFunnel,
  getGeo,
  getKpis,
  getOnlineSessions,
  getRecentLeads,
  getTimeSeries,
} from "@/lib/admin/queries";
import { getRange, parsePeriod, previousLabel } from "@/lib/admin/period";
import { channelLabel, countryName, DEVICE_LABELS, flagEmoji } from "@/lib/admin/constants";
import { formatDuration, formatNumber, formatPercent, plural } from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ButtonLink } from "@/components/admin/ui/button";
import { DeviceIcon, IconChart, IconInbox, IconUsers } from "@/components/admin/ui/icons";
import { PeriodSwitcher } from "@/components/admin/period-switcher";
import { KpiCard } from "@/components/admin/charts/kpi-card";
import { TrafficChart } from "@/components/admin/charts/traffic-chart";
import { LeadsChart } from "@/components/admin/charts/leads-chart";
import { BarList } from "@/components/admin/charts/bar-list";
import { SegmentedBar } from "@/components/admin/charts/segmented-bar";
import { Funnel } from "@/components/admin/charts/funnel";
import { OnlineSessionsList, RecentLeadsList } from "@/components/admin/lists";

export const metadata: Metadata = { title: "Обзор" };

export default async function OverviewPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const period = parsePeriod(sp.period, "7d");
  const range = getRange(period);

  const [kpis, series, channels, devices, geo, funnel, recentLeads, online] = await Promise.all([
    getKpis(range),
    getTimeSeries(range),
    getChannels(range),
    getDevices(range),
    getGeo(range),
    getFunnel(range),
    getRecentLeads(5),
    getOnlineSessions(8),
  ]);
  const now = range.end.getTime();
  const { current: cur, previous: prev } = kpis;
  const compare = previousLabel(period);
  const hasTraffic = cur.sessions > 0;
  const totalSessions = channels.reduce((a, c) => a + c.sessions, 0);
  const leadsInPeriod = series.reduce((a, p) => a + p.leads, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Обзор"
        description="Сводка по сайту · время Алматы"
        actions={<PeriodSwitcher pathname="/admin" searchParams={sp} value={period} />}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Ключевые показатели">
        <KpiCard label="Посетители" value={formatNumber(cur.visitors)} current={cur.visitors} previous={prev.visitors} compareLabel={compare} hint="Уникальные браузеры" />
        <KpiCard label="Визиты" value={formatNumber(cur.sessions)} current={cur.sessions} previous={prev.sessions} compareLabel={compare} />
        <KpiCard label="Заявки" value={formatNumber(cur.leads)} current={cur.leads} previous={prev.leads} compareLabel={compare} hint="Без спама" />
        <KpiCard
          label="Конверсия"
          value={formatPercent(cur.conversion, 1)}
          current={cur.conversion}
          previous={prev.conversion}
          compareLabel={compare}
          deltaMode="points"
          hint="Заявки / визиты"
        />
        <KpiCard label="Ср. время на сайте" value={formatDuration(cur.avgDuration)} current={cur.avgDuration} previous={prev.avgDuration} compareLabel={compare} />
        <KpiCard label="Глубина скролла" value={`${Math.round(cur.avgScroll)}%`} current={cur.avgScroll} previous={prev.avgScroll} compareLabel={compare} />
      </section>

      {!hasTraffic && recentLeads.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconChart />}
            title="Данных пока нет"
            description={
              process.env.NODE_ENV !== "production"
                ? "Как только на сайт придут посетители, здесь появится статистика. Для проверки интерфейса можно сгенерировать демо-данные."
                : "Как только на сайт придут посетители, здесь появится статистика."
            }
            action={
              process.env.NODE_ENV !== "production" ? (
                <ButtonLink href="/admin/settings#demo" variant="secondary" size="sm">
                  Демо-данные
                </ButtonLink>
              ) : undefined
            }
          />
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Посетители и визиты"
            description={range.granularity === "hour" ? "По часам, сегодня" : `По дням, ${range.label.toLowerCase()}`}
          />
          <div className="pb-4">
            <TrafficChart data={series} granularity={range.granularity} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title="Заявки"
            description={`${formatNumber(leadsInPeriod)} ${plural(leadsInPeriod, "заявка", "заявки", "заявок")} за период`}
          />
          <div className="pb-4">
            <LeadsChart data={series.map(({ key, leads }) => ({ key, leads }))} granularity={range.granularity} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Источники трафика" description="Доля визитов по каналам" />
          <CardBody>
            {channels.length ? (
              <BarList
                items={channels.slice(0, 8).map((c) => ({
                  key: c.channel,
                  label: channelLabel(c.channel),
                  value: c.sessions,
                  extra: c.conversions ? `${c.conversions} ${plural(c.conversions, "заявка", "заявки", "заявок")}` : undefined,
                  href: `/admin/visitors?period=${period}&channel=${encodeURIComponent(c.channel)}`,
                }))}
                total={totalSessions}
              />
            ) : (
              <EmptyState compact title="Нет визитов за период" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Устройства" description="Визиты по типу устройства" />
          <CardBody>
            {devices.length ? (
              <SegmentedBar
                segments={["mobile", "desktop", "tablet"]
                  .map((key) => ({
                    key,
                    label: DEVICE_LABELS[key]!,
                    value: devices.find((d) => d.key === key)?.count ?? 0,
                    icon: <DeviceIcon device={key} size={14} />,
                  }))
                  .concat(
                    devices
                      .filter((d) => !["mobile", "desktop", "tablet"].includes(d.key))
                      .map((d) => ({ key: d.key, label: "Другое", value: d.count, icon: <DeviceIcon device={null} size={14} /> })),
                  )}
              />
            ) : (
              <EmptyState compact title="Нет визитов за период" />
            )}
          </CardBody>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader title="География" description="Страны и города" />
          <CardBody>
            {geo.countries.length ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
                <BarList
                  items={geo.countries.slice(0, 5).map((c) => ({
                    key: c.country ?? "unknown",
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden>{flagEmoji(c.country)}</span>
                        {countryName(c.country)}
                      </span>
                    ),
                    value: c.count,
                  }))}
                  total={cur.sessions}
                />
                {geo.cities.length ? (
                  <div>
                    <p className="mono-label mb-2.5 text-mute">Города</p>
                    <ul className="grid gap-1.5">
                      {geo.cities.slice(0, 6).map((c) => (
                        <li key={`${c.country}-${c.city}`} className="flex items-center gap-2 text-[13px]">
                          <span aria-hidden>{flagEmoji(c.country)}</span>
                          <span className="flex-1 truncate text-fg">{c.city}</span>
                          <span className="font-medium text-fg tabular-nums">{formatNumber(c.count)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState compact title="Нет данных о географии" />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader title="Воронка" description="От визита до заявки" />
          <CardBody>
            {hasTraffic ? <Funnel steps={funnel} /> : <EmptyState compact title="Нет визитов за период" />}
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Последние заявки"
            action={
              <ButtonLink href="/admin/leads" variant="ghost" size="sm">
                Все
              </ButtonLink>
            }
          />
          {recentLeads.length ? (
            <RecentLeadsList leads={recentLeads} />
          ) : (
            <EmptyState compact icon={<IconInbox />} title="Заявок пока нет" description="Новые заявки с сайта появятся здесь" />
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Сейчас на сайте"
            description="Активность за последние 2 минуты"
            action={
              <ButtonLink href="/admin/visitors?online=1" variant="ghost" size="sm">
                Все
              </ButtonLink>
            }
          />
          {online.length ? (
            <OnlineSessionsList sessions={online} now={now} />
          ) : (
            <EmptyState compact icon={<IconUsers />} title="Сейчас никого нет" description="Живые визиты появятся автоматически" />
          )}
        </Card>
      </div>
    </div>
  );
}
