"use client";

export type TooltipRow = { label: string; value: string; color: string };

/** Dark tooltip: values lead, labels follow, series keyed with a short line. */
export function ChartTooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-[150px] rounded-xl border border-line-strong bg-graphite/95 px-3 py-2.5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur">
      <p className="mb-1.5 text-[11.5px] text-dim">{title}</p>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2.5">
            <span className="h-[2px] w-3 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="text-[13px] font-semibold text-fg tabular-nums">{r.value}</span>
            <span className="text-[12px] text-dim">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const AXIS_TICK = { fill: "#8d95a8", fontSize: 11, fontFamily: "var(--font-jetbrains), ui-monospace, monospace" };
export const GRID_STROKE = "rgba(255,255,255,0.06)";
export const SURFACE = "#0a0d14";
