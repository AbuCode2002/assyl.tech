import type { ReactNode } from "react";
import { CHART_COLORS } from "@/lib/admin/constants";
import { formatNumber, formatPercent } from "@/lib/admin/format";
import { cn } from "@/lib/cn";

export type BarListItem = {
  key: string;
  label: ReactNode;
  value: number;
  /** optional secondary text after the value, e.g. "3 заявки" */
  extra?: ReactNode;
  href?: string;
  title?: string;
};

/**
 * Horizontal bars, one series (single brand hue), value + share in text tokens.
 * `total` defaults to the sum of values; `scaleTo` sets the 100% bar length (defaults to max).
 */
export function BarList({
  items,
  total,
  scaleTo,
  showShare = true,
  valueFormatter = formatNumber,
  className,
  color = CHART_COLORS[0],
}: {
  items: BarListItem[];
  total?: number;
  scaleTo?: number;
  showShare?: boolean;
  valueFormatter?: (n: number) => string;
  className?: string;
  color?: string;
}) {
  const sum = total ?? items.reduce((a, b) => a + b.value, 0);
  const max = scaleTo ?? Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => {
        const width = max > 0 ? Math.max(item.value > 0 ? 1.5 : 0, (item.value / max) * 100) : 0;
        const inner = (
          <>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate text-fg">{item.label}</span>
              <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                {item.extra ? <span className="text-[12px] text-mute">{item.extra}</span> : null}
                <span className="font-medium text-fg">{valueFormatter(item.value)}</span>
                {showShare ? (
                  <span className="w-11 text-right text-[12px] text-dim">{sum > 0 ? formatPercent(item.value / sum, 0) : "—"}</span>
                ) : null}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${width}%`, backgroundColor: color }} />
            </div>
          </>
        );
        return (
          <li key={item.key} title={item.title}>
            {item.href ? (
              <a href={item.href} className="-mx-2 block rounded-lg px-2 py-1 transition-colors hover:bg-graphite/70">
                {inner}
              </a>
            ) : (
              <div className="py-1">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
