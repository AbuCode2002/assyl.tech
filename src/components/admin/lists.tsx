import Link from "next/link";
import type { LeadStatus } from "@/lib/db/schema";
import { channelLabel, countryName, deviceLabel, flagEmoji, SERVICE_LABELS } from "@/lib/admin/constants";
import { formatDuration, formatRelative } from "@/lib/admin/format";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { DeviceIcon } from "@/components/admin/ui/icons";
import { LiveDot } from "@/components/admin/ui/badge";

export type RecentLead = {
  id: string;
  number: number;
  name: string;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  services: string[];
  status: LeadStatus;
  channel: string | null;
  createdAt: Date;
};

export function RecentLeadsList({ leads }: { leads: RecentLead[] }) {
  return (
    <ul className="divide-y divide-line">
      {leads.map((lead) => (
        <li key={lead.id}>
          <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-graphite/60">
            <span className="w-9 shrink-0 font-mono text-[12px] text-mute">#{lead.number}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-fg">{lead.name}</p>
              <p className="truncate text-[12px] text-dim">
                {lead.services.length ? lead.services.map((s) => SERVICE_LABELS[s] ?? s).join(", ") : lead.phone ?? lead.email ?? lead.telegram ?? "—"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge status={lead.status} />
              <span className="text-[11.5px] text-mute">{formatRelative(lead.createdAt)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export type OnlineSession = {
  id: string;
  startedAt: Date;
  lastSeenAt: Date;
  duration: number;
  country: string | null;
  city: string | null;
  device: string | null;
  channel: string;
  landingPath: string | null;
  maxScroll: number;
};

export function OnlineSessionsList({ sessions, now }: { sessions: OnlineSession[]; now: number }) {
  return (
    <ul className="divide-y divide-line">
      {sessions.map((s) => (
        <li key={s.id}>
          <Link href={`/admin/visitors/${s.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-graphite/60">
            <span className="text-lg leading-none" aria-hidden>
              {flagEmoji(s.country)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] text-fg">{[s.city, countryName(s.country)].filter(Boolean).join(", ")}</p>
              <p className="flex items-center gap-1.5 truncate text-[12px] text-dim">
                <DeviceIcon device={s.device} size={13} />
                {deviceLabel(s.device)} · {channelLabel(s.channel)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ok tabular-nums">
                <LiveDot pulse />
                {formatDuration(Math.max(s.duration, (now - new Date(s.startedAt).getTime()) / 1000))}
              </span>
              <span className="text-[11.5px] text-mute tabular-nums">скролл {s.maxScroll}%</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
