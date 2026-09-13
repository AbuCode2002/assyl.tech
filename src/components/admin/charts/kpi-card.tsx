import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  current,
  previous,
  compareLabel,
  upIsGood = true,
  deltaMode = "relative",
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  current: number;
  previous: number;
  compareLabel: string;
  upIsGood?: boolean;
  /** relative = % change; points = absolute difference in percentage points (for ratios) */
  deltaMode?: "relative" | "points";
  hint?: string;
  className?: string;
}) {
  let deltaText = "—";
  let direction: "up" | "down" | "flat" = "flat";

  if (deltaMode === "points") {
    const diff = (current - previous) * 100;
    direction = Math.abs(diff) < 0.05 ? "flat" : diff > 0 ? "up" : "down";
    deltaText = `${diff > 0 ? "+" : diff < 0 ? "−" : ""}${Math.abs(diff).toFixed(1).replace(".", ",")} п.п.`;
  } else if (previous > 0) {
    const pct = ((current - previous) / previous) * 100;
    direction = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
    deltaText = `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0).replace(".", ",")}%`;
  } else if (current > 0) {
    direction = "up";
    deltaText = "новое";
  }

  const good = direction === "flat" ? null : (direction === "up") === upIsGood;

  return (
    <div className={cn("flex flex-col rounded-2xl border border-line bg-carbon p-4 sm:p-5", className)} title={hint}>
      <p className="text-[12.5px] font-medium text-dim">{label}</p>
      <p className="mt-2.5 font-display text-[22px] leading-none font-medium tracking-[-0.02em] text-fg tabular-nums sm:text-[26px]">
        {value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px]">
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium tabular-nums",
            good === null ? "text-dim" : good ? "text-ok" : "text-danger",
          )}
        >
          {direction === "up" ? <Arrow up /> : direction === "down" ? <Arrow /> : null}
          {deltaText}
        </span>
        <span className="text-mute">{compareLabel}</span>
      </div>
    </div>
  );
}

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("size-3", !up && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
