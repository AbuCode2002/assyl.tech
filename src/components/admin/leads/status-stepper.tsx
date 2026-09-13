"use client";

import { useOptimistic, useTransition } from "react";
import type { LeadStatus } from "@/lib/db/schema";
import { PIPELINE, STATUS_COLORS, STATUS_LABELS } from "@/lib/admin/constants";
import { updateLeadStatus } from "@/app/admin/(panel)/leads/actions";
import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/admin/ui/icons";

export function StatusStepper({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(status);
  const pipelineIndex = PIPELINE.indexOf(current);
  const closedNegative = current === "lost" || current === "spam";

  const set = (next: LeadStatus) => {
    if (next === current) return;
    startTransition(async () => {
      setCurrent(next);
      const res = await updateLeadStatus(leadId, next);
      if (!res.ok && res.error) window.alert(res.error);
    });
  };

  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center", pending && "opacity-80")}>
      <ol className="flex flex-1 items-center gap-1 overflow-x-auto">
        {PIPELINE.map((s, i) => {
          const done = !closedNegative && pipelineIndex >= 0 && i < pipelineIndex;
          const active = s === current;
          const color = STATUS_COLORS[s];
          return (
            <li key={s} className="flex min-w-0 flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => set(s)}
                disabled={pending}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-9 w-full min-w-[104px] items-center justify-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors",
                  active ? "text-fg" : done ? "border-line bg-graphite text-dim hover:text-fg" : "border-line text-mute hover:border-line-strong hover:text-dim",
                )}
                style={active ? { borderColor: `${color}66`, backgroundColor: `${color}1f` } : undefined}
              >
                {done ? (
                  <IconCheck size={13} className="text-ok" />
                ) : (
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: active ? color : "#545b6d" }} />
                )}
                {STATUS_LABELS[s]}
              </button>
              {i < PIPELINE.length - 1 ? <span className={cn("h-px w-3 shrink-0", done ? "bg-line-strong" : "bg-line")} /> : null}
            </li>
          );
        })}
      </ol>
      <div className="flex gap-1.5">
        {(["lost", "spam"] as const).map((s) => {
          const active = current === s;
          const color = STATUS_COLORS[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => set(s)}
              disabled={pending}
              className={cn(
                "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-medium whitespace-nowrap transition-colors lg:flex-none",
                active ? "text-fg" : "border-line text-mute hover:border-line-strong hover:text-dim",
              )}
              style={active ? { borderColor: `${color}66`, backgroundColor: `${color}1f` } : undefined}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: active ? color : "#545b6d" }} />
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
