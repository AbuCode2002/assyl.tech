import type { ReactNode } from "react";
import { CHART_COLORS } from "@/lib/admin/constants";
import { formatNumber, formatPercent } from "@/lib/admin/format";

export type Segment = { key: string; label: string; value: number; icon?: ReactNode; color?: string };

/** Part-to-whole stacked bar with 2px surface gaps and a legend carrying values. */
export function SegmentedBar({ segments, total }: { segments: Segment[]; total?: number }) {
  const sum = total ?? segments.reduce((a, s) => a + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-white/[0.04]" role="img" aria-label="Распределение">
        {visible.map((s, i) => (
          <div
            key={s.key}
            title={`${s.label}: ${formatNumber(s.value)} (${formatPercent(sum ? s.value / sum : 0, 0)})`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${sum ? (s.value / sum) * 100 : 0}%`, backgroundColor: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
          />
        ))}
      </div>
      <ul className="mt-4 grid gap-2.5">
        {segments.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
            {s.icon ? <span className="text-dim">{s.icon}</span> : null}
            <span className="flex-1 text-fg">{s.label}</span>
            <span className="font-medium text-fg tabular-nums">{formatNumber(s.value)}</span>
            <span className="w-11 text-right text-[12px] text-dim tabular-nums">{sum ? formatPercent(s.value / sum, 0) : "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
