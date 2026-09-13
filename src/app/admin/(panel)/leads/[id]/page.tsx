import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdmin, requireAdmin } from "@/lib/auth/server";
import { getLead, getLeadJourney, getLeadNotes, onlineSinceMs } from "@/lib/admin/queries";
import { channelLabel, countryName, deviceLabel, flagEmoji, LOCALE_LABELS, SERVICE_LABELS } from "@/lib/admin/constants";
import {
  formatDateTime,
  formatDuration,
  formatFullDateTime,
  formatRelative,
  phoneDigits,
  telegramUsername,
} from "@/lib/admin/format";
import { Card, CardBody, CardHeader, InfoRow } from "@/components/admin/ui/card";
import { Chip } from "@/components/admin/ui/badge";
import { ButtonAnchor } from "@/components/admin/ui/button";
import { CopyButton } from "@/components/admin/ui/copy-button";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import {
  DeviceIcon,
  IconArrowLeft,
  IconMail,
  IconNote,
  IconPhone,
  IconSpark,
  IconTelegram,
  IconUsers,
  IconWhatsApp,
} from "@/components/admin/ui/icons";
import { StatusStepper } from "@/components/admin/leads/status-stepper";
import { DeleteNoteButton, NoteForm } from "@/components/admin/leads/note-form";
import { DeleteLeadButton } from "@/components/admin/leads/delete-lead-button";
import { EventTimeline, SessionsList } from "@/components/admin/journey";

export async function generateMetadata({ params }: PageProps<"/admin/leads/[id]">): Promise<Metadata> {
  if (!(await getAdmin())) return { title: "Заявка" };
  const { id } = await params;
  const lead = await getLead(id).catch(() => null);
  return { title: lead ? `Заявка #${lead.number}` : "Заявка" };
}

export default async function LeadDetailPage({ params }: PageProps<"/admin/leads/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const [notes, journey] = await Promise.all([getLeadNotes(lead.id), getLeadJourney(lead)]);
  const { session, events, otherSessions } = journey;
  const onlineSince = onlineSinceMs();

  const digits = lead.phone ? phoneDigits(lead.phone) : null;
  const tg = lead.telegram ? telegramUsername(lead.telegram) : null;
  const utm = lead.utm ?? {};
  const utmEntries = Object.entries(utm).filter(([, v]) => v);

  return (
    <div className="space-y-5">
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-[13px] text-dim hover:text-fg">
        <IconArrowLeft size={15} /> Заявки
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] text-mute">#{lead.number}</span>
            <StatusBadge status={lead.status} />
            {lead.ipHash === "demo" ? <Chip>демо</Chip> : null}
          </div>
          <h1 className="font-display text-[24px] leading-tight font-medium tracking-[-0.02em] break-words text-fg sm:text-[30px]">
            {lead.name}
          </h1>
          <p className="mt-1.5 text-[13px] text-dim">
            {formatFullDateTime(lead.createdAt)} · {formatRelative(lead.createdAt)}
            {lead.company ? ` · ${lead.company}` : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {lead.phone && digits ? (
            <ButtonAnchor href={`tel:+${digits}`} variant="primary" size="sm" className="h-9">
              <IconPhone size={15} /> Позвонить
            </ButtonAnchor>
          ) : null}
          {digits ? (
            <ButtonAnchor href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" variant="secondary" size="sm" className="h-9">
              <IconWhatsApp size={15} /> WhatsApp
            </ButtonAnchor>
          ) : null}
          {tg ? (
            <ButtonAnchor href={`https://t.me/${tg}`} target="_blank" rel="noreferrer" variant="secondary" size="sm" className="h-9">
              <IconTelegram size={15} /> Telegram
            </ButtonAnchor>
          ) : null}
          {lead.email ? (
            <ButtonAnchor href={`mailto:${lead.email}`} variant="secondary" size="sm" className="h-9">
              <IconMail size={15} /> Email
            </ButtonAnchor>
          ) : null}
        </div>
      </div>

      <Card className="p-3 sm:p-4">
        <StatusStepper leadId={lead.id} status={lead.status} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Form fields */}
          <Card>
            <CardHeader title="Заявка" description="Данные из формы на сайте" />
            <CardBody className="space-y-4">
              <div>
                <p className="mono-label mb-2 text-mute">Услуги</p>
                {lead.services.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {lead.services.map((s) => (
                      <Chip key={s} className="h-7 text-[12.5px] text-fg">
                        {SERVICE_LABELS[s] ?? s}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-mute">Не выбраны</p>
                )}
              </div>
              <dl className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Бюджет", lead.budget],
                  ["Сроки", lead.timeline],
                  ["Компания", lead.company],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-line bg-graphite/40 px-3.5 py-2.5">
                    <dt className="text-[12px] text-dim">{label}</dt>
                    <dd className="mt-0.5 text-[14px] break-words text-fg">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <p className="mono-label mb-2 text-mute">Сообщение</p>
                {lead.message ? (
                  <div className="rounded-xl border border-line bg-graphite/60 px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap text-fg">
                    {lead.message}
                  </div>
                ) : (
                  <p className="text-[13px] text-mute">Без сообщения</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Journey */}
          <Card>
            <CardHeader
              title="Путь посетителя"
              description={
                session
                  ? `Визит ${formatDateTime(session.startedAt)} · ${formatDuration(session.duration)} · скролл ${session.maxScroll}%`
                  : "Визит не связан с заявкой"
              }
              action={
                session ? (
                  <Link href={`/admin/visitors/${session.id}`} className="text-[13px] text-dim hover:text-fg">
                    Визит →
                  </Link>
                ) : null
              }
            />
            <CardBody>
              {session && events.length ? (
                <EventTimeline events={events} startedAt={session.startedAt} />
              ) : (
                <EmptyState
                  compact
                  icon={<IconSpark />}
                  title="Нет событий"
                  description="Трекинг не зафиксировал действий — возможно, у посетителя блокировщик или заявка создана до запуска аналитики."
                />
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader title="Заметки" description="История работы с заявкой" />
            <CardBody className="space-y-5">
              <NoteForm leadId={lead.id} />
              {notes.length ? (
                <ol className="space-y-3">
                  {notes.map((n) => (
                    <li key={n.id} className="group flex gap-3">
                      <span
                        className={
                          n.kind === "status"
                            ? "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-graphite text-dim"
                            : "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-signal/30 bg-signal/10 text-[#8fb3ff]"
                        }
                      >
                        {n.kind === "status" ? <IconSpark size={13} /> : <IconNote size={13} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[12px] text-mute">
                          <span className="text-dim">{n.authorName ?? "Система"}</span>
                          <span>·</span>
                          <span title={formatFullDateTime(n.createdAt)}>{formatDateTime(n.createdAt)}</span>
                          <span className="ml-auto">
                            <DeleteNoteButton noteId={n.id} leadId={lead.id} />
                          </span>
                        </div>
                        <p
                          className={
                            n.kind === "status"
                              ? "text-[13px] text-dim"
                              : "mt-0.5 text-[14px] leading-relaxed whitespace-pre-wrap text-fg"
                          }
                        >
                          {n.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[13px] text-mute">Заметок пока нет. Изменения статуса записываются автоматически.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Контакты" />
            <CardBody>
              <dl>
                <ContactRow label="Телефон" value={lead.phone} href={digits ? `tel:+${digits}` : undefined} />
                <ContactRow label="Email" value={lead.email} href={lead.email ? `mailto:${lead.email}` : undefined} />
                <ContactRow label="Telegram" value={lead.telegram} href={tg ? `https://t.me/${tg}` : undefined} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Источник" />
            <CardBody>
              <dl>
                <InfoRow label="Канал">{channelLabel(lead.channel)}</InfoRow>
                {utmEntries.map(([k, v]) => (
                  <InfoRow key={k} label={`utm_${k}`}>
                    <span className="font-mono text-[12px]">{v}</span>
                  </InfoRow>
                ))}
                <InfoRow label="Страница">
                  <span className="font-mono text-[12px]">{lead.page ?? session?.landingPath ?? "—"}</span>
                </InfoRow>
                {session?.landingPath && session.landingPath !== lead.page ? (
                  <InfoRow label="Вход">
                    <span className="font-mono text-[12px]">{session.landingPath}</span>
                  </InfoRow>
                ) : null}
                {session?.referrerHost ? <InfoRow label="Реферер">{session.referrerHost}</InfoRow> : null}
                <InfoRow label="Язык сайта">{LOCALE_LABELS[lead.locale ?? ""] ?? lead.locale ?? "—"}</InfoRow>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Гео и устройство" />
            <CardBody>
              <dl>
                <InfoRow label="Страна">
                  <span aria-hidden>{flagEmoji(lead.country)}</span> {countryName(lead.country)}
                </InfoRow>
                <InfoRow label="Город">{lead.city ?? "—"}</InfoRow>
                <InfoRow label="Устройство">
                  <span className="inline-flex items-center gap-1.5">
                    <DeviceIcon device={lead.device} size={14} /> {deviceLabel(lead.device)}
                  </span>
                </InfoRow>
                {session?.browser || session?.os ? (
                  <InfoRow label="Браузер / ОС">{[session.browser, session.os].filter(Boolean).join(" · ")}</InfoRow>
                ) : null}
                {session?.screen ? <InfoRow label="Экран">{session.screen}</InfoRow> : null}
              </dl>
              {lead.userAgent ? (
                <p className="mt-3 rounded-lg bg-graphite/60 px-3 py-2 font-mono text-[11px] leading-relaxed break-all text-mute">
                  {lead.userAgent}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Другие визиты" description="Этого же посетителя" />
            {otherSessions.length ? (
              <SessionsList sessions={otherSessions} onlineSince={onlineSince} />
            ) : (
              <EmptyState compact icon={<IconUsers />} title="Других визитов нет" />
            )}
          </Card>

          <Card className="border-danger/15">
            <CardHeader title="Удаление" description="Действие необратимо" />
            <CardBody>
              <DeleteLeadButton leadId={lead.id} number={lead.number} name={lead.name} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string | null; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2 first:border-t-0">
      <dt className="shrink-0 text-[13px] text-dim">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1">
        {value ? (
          <>
            {href ? (
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="truncate text-[13px] text-fg hover:text-[#8fb3ff]"
              >
                {value}
              </a>
            ) : (
              <span className="truncate text-[13px] text-fg">{value}</span>
            )}
            <CopyButton value={value} label={`Скопировать ${label.toLowerCase()}`} />
          </>
        ) : (
          <span className="text-[13px] text-mute">—</span>
        )}
      </dd>
    </div>
  );
}
