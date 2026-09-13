"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import type { LeadStatus } from "@/lib/db/schema";
import { channelLabel, LEAD_STATUSES, SERVICE_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/admin/constants";
import { formatNumber, formatRelative } from "@/lib/admin/format";
import { updateLeadStatus } from "@/app/admin/(panel)/leads/actions";
import { cn } from "@/lib/cn";

export type KanbanLead = {
  id: string;
  number: number;
  name: string;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  company: string | null;
  services: string[];
  budget: string | null;
  channel: string | null;
  status: LeadStatus;
  createdAt: string;
};

type Move = { id: string; status: LeadStatus };

export function LeadsKanban({ leads }: { leads: KanbanLead[] }) {
  const [, startTransition] = useTransition();
  const [optimisticLeads, applyMove] = useOptimistic(leads, (state: KanbanLead[], move: Move) =>
    state.map((l) => (l.id === move.id ? { ...l, status: move.status } : l)),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);

  const move = (id: string, status: LeadStatus) => {
    const lead = optimisticLeads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    startTransition(async () => {
      applyMove({ id, status });
      const res = await updateLeadStatus(id, status);
      if (!res.ok && res.error) window.alert(res.error);
    });
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div className="flex min-w-max gap-3 snap-x snap-mandatory lg:snap-none">
        {LEAD_STATUSES.map((status) => {
          const items = optimisticLeads.filter((l) => l.status === status);
          const color = STATUS_COLORS[status];
          const isOver = overCol === status && dragId !== null;
          return (
            <section
              key={status}
              aria-label={STATUS_LABELS[status]}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overCol !== status) setOverCol(status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverCol((c) => (c === status ? null : c));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                setOverCol(null);
                setDragId(null);
                if (id) move(id, status);
              }}
              className={cn(
                "flex w-[82vw] max-w-[300px] shrink-0 snap-start flex-col rounded-2xl border bg-carbon transition-colors sm:w-[280px]",
                isOver ? "border-line-strong bg-graphite/60" : "border-line",
              )}
            >
              <header className="flex items-center gap-2 border-b border-line px-4 py-3">
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="text-[13px] font-semibold text-fg">{STATUS_LABELS[status]}</h3>
                <span className="ml-auto rounded-full bg-graphite px-2 py-0.5 text-[11.5px] text-dim tabular-nums">
                  {formatNumber(items.length)}
                </span>
              </header>
              <div className="flex max-h-[calc(100dvh-300px)] min-h-40 flex-col gap-2 overflow-y-auto p-2.5">
                {items.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(lead.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    className={cn(
                      "group rounded-xl border border-line bg-graphite p-3 transition-[border-color,opacity] hover:border-line-strong",
                      "cursor-grab active:cursor-grabbing",
                      dragId === lead.id && "opacity-40",
                    )}
                  >
                    <Link href={`/admin/leads/${lead.id}`} className="block" draggable={false}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-[13.5px] font-medium text-fg">{lead.name}</p>
                        <span className="shrink-0 font-mono text-[11px] text-mute">#{lead.number}</span>
                      </div>
                      {lead.company ? <p className="mt-0.5 truncate text-[12px] text-dim">{lead.company}</p> : null}
                      {lead.services.length ? (
                        <p className="mt-2 line-clamp-2 text-[12px] text-dim">
                          {lead.services.map((s) => SERVICE_LABELS[s] ?? s).join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11.5px] text-mute">
                        <span className="truncate">{lead.budget ?? channelLabel(lead.channel)}</span>
                        <span className="shrink-0" suppressHydrationWarning>{formatRelative(lead.createdAt)}</span>
                      </div>
                    </Link>
                    <label className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5 lg:hidden">
                      <span className="text-[11.5px] text-mute">Статус</span>
                      <select
                        value={lead.status}
                        onChange={(e) => move(lead.id, e.target.value as LeadStatus)}
                        className="h-7 flex-1 rounded-lg border border-line bg-carbon px-2 text-[12px] text-fg"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
                {items.length === 0 ? (
                  <div
                    className={cn(
                      "grid flex-1 place-items-center rounded-xl border border-dashed px-3 py-6 text-center text-[12px] transition-colors",
                      isOver ? "border-line-strong text-dim" : "border-line text-mute",
                    )}
                  >
                    {dragId ? "Перетащите сюда" : "Пусто"}
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
