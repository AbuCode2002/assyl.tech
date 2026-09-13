"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/admin/constants";
import { formatDayKey, formatNumber, plural } from "@/lib/admin/format";
import { AXIS_TICK, ChartTooltipBox, GRID_STROKE } from "./chart-tooltip";

export type LeadsPoint = { key: string; leads: number };

export function LeadsChart({ data, granularity }: { data: LeadsPoint[]; granularity: "hour" | "day" }) {
  const fmtKey = (k: string) => (granularity === "hour" ? k : formatDayKey(k));
  const max = Math.max(0, ...data.map((d) => d.leads));

  return (
    <div>
      <div className="h-[260px] w-full pr-3 sm:pr-5">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 260 }}>
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis
              dataKey="key"
              tickFormatter={fmtKey}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              minTickGap={20}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.max(3, max)]}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const row = active ? (payload?.[0]?.payload as LeadsPoint | undefined) : undefined;
                if (!row) return null;
                return (
                  <ChartTooltipBox
                    title={fmtKey(row.key)}
                    rows={[
                      {
                        label: plural(row.leads, "заявка", "заявки", "заявок"),
                        value: formatNumber(row.leads),
                        color: CHART_COLORS[0],
                      },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="leads"
              name="Заявки"
              fill={CHART_COLORS[0]}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
              activeBar={{ fill: "#5a8fff" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Заявки по периодам</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <td>{fmtKey(d.key)}</td>
              <td>{d.leads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
