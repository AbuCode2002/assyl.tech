"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/admin/constants";
import { formatDayKey, formatNumber } from "@/lib/admin/format";
import { AXIS_TICK, ChartTooltipBox, GRID_STROKE, SURFACE } from "./chart-tooltip";

export type TrafficPoint = { key: string; visitors: number; sessions: number };

const SERIES = [
  { key: "visitors", label: "Посетители", color: CHART_COLORS[0] },
  { key: "sessions", label: "Визиты", color: CHART_COLORS[1] },
] as const;

export function TrafficChart({ data, granularity }: { data: TrafficPoint[]; granularity: "hour" | "day" }) {
  const fmtKey = (k: string) => (granularity === "hour" ? k : formatDayKey(k));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 px-5">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2 text-[12.5px] text-dim">
            <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="h-[260px] w-full pr-3 sm:pr-5">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis
              dataKey="key"
              tickFormatter={fmtKey}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              minTickGap={24}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.22)", strokeWidth: 1 }}
              isAnimationActive={false}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as TrafficPoint | undefined;
                if (!row) return null;
                return (
                  <ChartTooltipBox
                    title={fmtKey(String(label ?? row.key))}
                    rows={SERIES.map((s) => ({ label: s.label, value: formatNumber(row[s.key]), color: s.color }))}
                  />
                );
              }}
            />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{ r: 4, fill: s.color, stroke: SURFACE, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Посетители и визиты</caption>
        <thead>
          <tr>
            <th>Период</th>
            <th>Посетители</th>
            <th>Визиты</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <td>{fmtKey(d.key)}</td>
              <td>{d.visitors}</td>
              <td>{d.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
