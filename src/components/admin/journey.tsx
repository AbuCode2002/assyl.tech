import Link from "next/link";
import type { ReactNode } from "react";
import type { EventRow } from "@/lib/db/schema";
import { channelLabel, clickLabel, deviceLabel, LOCALE_LABELS, SECTION_LABELS } from "@/lib/admin/constants";
import { formatDateTime, formatDuration, formatOffset, formatTime } from "@/lib/admin/format";
import { Badge } from "@/components/admin/ui/badge";
import {
  DeviceIcon,
  IconCursor,
  IconEye,
  IconForm,
  IconGlobe,
  IconLanguage,
  IconPlay,
  IconScroll,
  IconSend,
} from "@/components/admin/ui/icons";
import { cn } from "@/lib/cn";

function describe(e: EventRow): { icon: ReactNode; title: ReactNode; tone: "default" | "signal" | "ok" } {
  switch (e.type) {
    case "pageview":
      return { icon: <IconGlobe size={14} />, title: <>Открыл страницу <span className="font-mono text-[12px] text-dim">{e.path ?? "/"}</span></>, tone: "default" };
    case "section":
      return { icon: <IconEye size={14} />, title: <>Просмотрел блок «{SECTION_LABELS[e.name ?? ""] ?? e.name}»</>, tone: "default" };
    case "click":
      return { icon: <IconCursor size={14} />, title: <>Клик: {clickLabel(e.name)}</>, tone: "signal" };
    case "scroll":
      return { icon: <IconScroll size={14} />, title: <>Прокрутил страницу на {e.name}%</>, tone: "default" };
    case "form_start":
      return { icon: <IconForm size={14} />, title: "Начал заполнять форму", tone: "signal" };
    case "form_submit":
      return { icon: <IconSend size={14} />, title: "Отправил заявку", tone: "ok" };
    case "video":
      return { icon: <IconPlay size={14} />, title: <>Видео: {e.name ?? "—"}</>, tone: "default" };
    case "locale":
      return { icon: <IconLanguage size={14} />, title: <>Сменил язык: {LOCALE_LABELS[e.name ?? ""] ?? e.name}</>, tone: "default" };
    default:
      return { icon: <IconCursor size={14} />, title: `${e.type}${e.name ? `: ${e.name}` : ""}`, tone: "default" };
  }
}

export function EventTimeline({ events, startedAt }: { events: EventRow[]; startedAt: Date }) {
  const start = new Date(startedAt).getTime();
  return (
    <ol className="relative">
      {events.map((e, i) => {
        const d = describe(e);
        const offset = (new Date(e.createdAt).getTime() - start) / 1000;
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="relative flex gap-3 pb-3 last:pb-0">
            {!last ? <span aria-hidden className="absolute top-7 bottom-0 left-[13px] w-px bg-line" /> : null}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border",
                d.tone === "ok" && "border-ok/30 bg-ok/10 text-ok",
                d.tone === "signal" && "border-signal/30 bg-signal/10 text-[#8fb3ff]",
                d.tone === "default" && "border-line bg-graphite text-dim",
              )}
            >
              {d.icon}
            </span>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pt-1">
              <p className="min-w-0 text-[13px] leading-snug text-fg">{d.title}</p>
              <span className="shrink-0 font-mono text-[11px] text-mute tabular-nums" title={formatTime(e.createdAt, true)}>
                {formatOffset(offset)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export type SessionSummary = {
  id: string;
  startedAt: Date;
  lastSeenAt: Date;
  duration: number;
  events: number;
  maxScroll: number;
  channel: string;
  device: string | null;
  landingPath: string | null;
  converted: boolean;
};

export function SessionsList({ sessions, currentId, onlineSince }: { sessions: SessionSummary[]; currentId?: string; onlineSince: number }) {
  return (
    <ul className="divide-y divide-line">
      {sessions.map((s) => {
        const online = new Date(s.lastSeenAt).getTime() > onlineSince;
        return (
          <li key={s.id}>
            <Link
              href={`/admin/visitors/${s.id}`}
              className={cn("flex items-center gap-3 px-5 py-3 transition-colors hover:bg-graphite/60", s.id === currentId && "bg-graphite/50")}
            >
              <span className="text-dim">
                <DeviceIcon device={s.device} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-fg">{formatDateTime(s.startedAt)}</p>
                <p className="truncate text-[12px] text-dim">
                  {channelLabel(s.channel)} · {deviceLabel(s.device)} · {formatDuration(s.duration)} · {s.events} соб.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {online ? (
                  <Badge tone="ok" dot pulse>
                    Онлайн
                  </Badge>
                ) : null}
                {s.converted ? <Badge tone="signal">Заявка</Badge> : null}
                {s.id === currentId ? <span className="text-[11px] text-mute">текущий</span> : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
