"use client";

import { useOptimistic, useTransition } from "react";
import type { LeadStatus } from "@/lib/db/schema";
import { LEAD_STATUSES, STATUS_COLORS, STATUS_LABELS } from "@/lib/admin/constants";
import { updateLeadStatus } from "@/app/admin/(panel)/leads/actions";
import { cn } from "@/lib/cn";

export function StatusSelect({
  leadId,
  status,
  className,
  size = "sm",
}: {
  leadId: string;
  status: LeadStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const color = STATUS_COLORS[optimistic];

  return (
    <div className={cn("relative inline-flex", className)}>
      <span className="pointer-events-none absolute top-1/2 left-2.5 size-1.5 -translate-y-1/2 rounded-full" style={{ backgroundColor: color }} />
      <select
        aria-label="Статус заявки"
        value={optimistic}
        disabled={pending}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const next = e.target.value as LeadStatus;
          startTransition(async () => {
            setOptimistic(next);
            const res = await updateLeadStatus(leadId, next);
            if (!res.ok && res.error) window.alert(res.error);
          });
        }}
        className={cn(
          "cursor-pointer appearance-none rounded-full border pr-7 pl-6 font-medium text-fg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ion/50 disabled:cursor-wait disabled:opacity-70",
          size === "sm" ? "h-7 text-[12px]" : "h-9 text-[13px]",
        )}
        style={{ borderColor: `${color}45`, backgroundColor: `${color}14` }}
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-graphite text-fg">
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-dim"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m7 10 5 5 5-5" />
      </svg>
    </div>
  );
}
