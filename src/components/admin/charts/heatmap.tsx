"use client";

import { useState } from "react";
import { formatNumber, plural } from "@/lib/admin/format";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/** Weekday × hour heatmap, sequential single hue (signal) — more is brighter on the dark surface. */
export function WeekHourHeatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(0, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);

  const readout = hover
    ? `${DAYS[hover.d]}, ${String(hover.h).padStart(2, "0")}:00–${String((hover.h + 1) % 24).padStart(2, "0")}:00 — ${formatNumber(grid[hover.d]![hover.h]!)} ${plural(grid[hover.d]![hover.h]!, "визит", "визита", "визитов")}`
    : `Всего ${formatNumber(total)} ${plural(total, "визит", "визита", "визитов")} · время Алматы`;

  return (
    <div>
      <p className="mb-3 h-5 text-[12.5px] text-dim tabular-nums" aria-live="polite">
        {readout}
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))] gap-[3px]">
            {grid.map((row, d) => (
              <div key={d} className="contents">
                <div className="flex items-center font-mono text-[10.5px] text-mute">{DAYS[d]}</div>
                {row.map((v, h) => {
                  const t = max > 0 ? v / max : 0;
                  const active = hover?.d === d && hover?.h === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      aria-label={`${DAYS[d]} ${h}:00 — ${v}`}
                      onMouseEnter={() => setHover({ d, h })}
                      onFocus={() => setHover({ d, h })}
                      onMouseLeave={() => setHover(null)}
                      onBlur={() => setHover(null)}
                      className="aspect-square min-h-4 rounded-[4px] outline-none focus-visible:ring-1 focus-visible:ring-ion"
                      style={{
                        backgroundColor: v === 0 ? "rgba(255,255,255,0.03)" : `rgba(59,123,255,${0.12 + t * 0.88})`,
                        boxShadow: active ? "0 0 0 1.5px rgba(238,242,248,0.9)" : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-[28px_repeat(24,minmax(0,1fr))] gap-[3px]">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center font-mono text-[10px] text-mute">
                {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-mute">
        <span>0</span>
        <span
          className="h-2 w-28 rounded-full"
          style={{ background: "linear-gradient(90deg, rgba(59,123,255,0.12), rgba(59,123,255,1))" }}
        />
        <span className="tabular-nums">{formatNumber(max)}</span>
      </div>
    </div>
  );
}
