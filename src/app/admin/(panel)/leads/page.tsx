import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/server";
import { countLeadsByStatus, listLeads } from "@/lib/admin/queries";
import { channelLabel, isLeadStatus, SERVICE_LABELS } from "@/lib/admin/constants";
import { formatDateTime, formatNumber, formatRelative, plural } from "@/lib/admin/format";
import { parsePeriod } from "@/lib/admin/period";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { Chip } from "@/components/admin/ui/badge";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ButtonAnchor } from "@/components/admin/ui/button";
import { Segmented, withParams } from "@/components/admin/ui/segmented";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/admin/ui/table";
import { IconDownload, IconInbox, IconKanban, IconTable } from "@/components/admin/ui/icons";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { LeadsFilters } from "@/components/admin/leads/leads-filters";
import { LeadsKanban } from "@/components/admin/leads/leads-kanban";
import { StatusSelect } from "@/components/admin/leads/status-select";

export const metadata: Metadata = { title: "Заявки" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const view = str(sp.view) === "kanban" ? "kanban" : "table";
  const q = str(sp.q).slice(0, 100);
  const statusParam = str(sp.status);
  const status = isLeadStatus(statusParam) ? statusParam : null;
  const period = str(sp.period) && str(sp.period) !== "all" ? parsePeriod(sp.period) : "all";

  const [leads, counts] = await Promise.all([
    listLeads({ status: view === "kanban" ? null : status, q, period }),
    countLeadsByStatus(),
  ]);
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  const exportHref = withParams("/admin/leads/export", {}, { q, status: status ?? undefined, period: period === "all" ? undefined : period });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Заявки"
        description={`${formatNumber(totalAll)} ${plural(totalAll, "заявка", "заявки", "заявок")} всего · ${formatNumber(counts.new)} ${plural(counts.new, "новая", "новые", "новых")}`}
        actions={
          <>
            <Segmented
              value={view}
              items={[
                { value: "table", label: "Таблица", icon: <IconTable size={15} />, href: withParams("/admin/leads", sp, { view: null }) },
                { value: "kanban", label: "Канбан", icon: <IconKanban size={15} />, href: withParams("/admin/leads", sp, { view: "kanban" }) },
              ]}
            />
            <ButtonAnchor href={exportHref} variant="secondary" size="sm" className="h-9">
              <IconDownload size={15} /> CSV
            </ButtonAnchor>
          </>
        }
      />

      <LeadsFilters q={q} status={view === "kanban" ? "" : (status ?? "")} period={period} view={view} counts={counts} />

      {totalAll === 0 ? (
        <Card>
          <EmptyState
            icon={<IconInbox />}
            title="Заявок пока нет"
            description="Когда посетитель отправит форму на сайте, заявка появится здесь, а в Telegram придёт уведомление (если настроено)."
          />
        </Card>
      ) : view === "kanban" ? (
        <LeadsKanban
          leads={leads.map((l) => ({
            id: l.id,
            number: l.number,
            name: l.name,
            phone: l.phone,
            email: l.email,
            telegram: l.telegram,
            company: l.company,
            services: l.services,
            budget: l.budget,
            channel: l.channel,
            status: l.status,
            createdAt: l.createdAt.toISOString(),
          }))}
        />
      ) : leads.length === 0 ? (
        <Card>
          <EmptyState icon={<IconInbox />} title="Ничего не найдено" description="Попробуйте изменить фильтры или поисковый запрос" />
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-2.5 md:hidden">
            {leads.map((lead) => (
              <li key={lead.id} className="rounded-2xl border border-line bg-carbon">
                <Link href={`/admin/leads/${lead.id}`} className="block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-fg">{lead.name}</p>
                      <p className="mt-0.5 truncate text-[13px] text-dim">{lead.phone ?? lead.telegram ?? lead.email ?? "—"}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[12px] text-mute">#{lead.number}</span>
                  </div>
                  {lead.services.length ? (
                    <p className="mt-2 line-clamp-2 text-[12.5px] text-dim">
                      {lead.services.map((s) => SERVICE_LABELS[s] ?? s).join(" · ")}
                    </p>
                  ) : null}
                </Link>
                <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
                  <span className="text-[12px] text-mute">
                    {formatRelative(lead.createdAt)} · {channelLabel(lead.channel)}
                  </span>
                  <StatusSelect leadId={lead.id} status={lead.status} />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <TableWrap>
              <Table className="min-w-[1080px]">
                <THead>
                  <tr>
                    <TH className="w-14">#</TH>
                    <TH>Дата</TH>
                    <TH>Имя</TH>
                    <TH>Контакт</TH>
                    <TH>Услуги</TH>
                    <TH>Бюджет</TH>
                    <TH>Источник</TH>
                    <TH className="w-44">Статус</TH>
                  </tr>
                </THead>
                <tbody>
                  {leads.map((lead) => (
                    <TR key={lead.id}>
                      <TD className="font-mono text-[12px] text-mute">
                        <Link href={`/admin/leads/${lead.id}`} className="hover:text-fg">
                          {lead.number}
                        </Link>
                      </TD>
                      <TD className="whitespace-nowrap text-dim">{formatDateTime(lead.createdAt)}</TD>
                      <TD className="max-w-[220px]">
                        <Link href={`/admin/leads/${lead.id}`} className="block truncate font-medium text-fg hover:text-[#8fb3ff]">
                          {lead.name}
                        </Link>
                        {lead.company ? <span className="block truncate text-[12px] text-mute">{lead.company}</span> : null}
                      </TD>
                      <TD className="max-w-[220px]">
                        <div className="flex flex-col text-[12.5px]">
                          {lead.phone ? <span className="truncate text-fg">{lead.phone}</span> : null}
                          {lead.telegram ? <span className="truncate text-dim">tg: {lead.telegram}</span> : null}
                          {lead.email ? <span className="truncate text-dim">{lead.email}</span> : null}
                        </div>
                      </TD>
                      <TD className="max-w-[260px]">
                        <div className="flex flex-wrap gap-1 py-1.5">
                          {lead.services.slice(0, 3).map((s) => (
                            <Chip key={s}>{SERVICE_LABELS[s] ?? s}</Chip>
                          ))}
                          {lead.services.length > 3 ? <Chip>+{lead.services.length - 3}</Chip> : null}
                          {lead.services.length === 0 ? <span className="text-mute">—</span> : null}
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap text-dim">{lead.budget ?? "—"}</TD>
                      <TD className="whitespace-nowrap text-dim">{channelLabel(lead.channel)}</TD>
                      <TD>
                        <StatusSelect leadId={lead.id} status={lead.status} />
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
          {leads.length >= 500 ? (
            <p className="text-center text-[12px] text-mute">Показаны последние 500 заявок — уточните фильтры или выгрузите CSV.</p>
          ) : null}
        </>
      )}
      {view === "kanban" && status ? (
        <p className="text-[12px] text-mute">
          Фильтр по статусу не применяется в канбане. <StatusBadge status={status} className="ml-1" />
        </p>
      ) : null}
    </div>
  );
}
