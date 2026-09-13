import type { FunnelStep } from "@/lib/admin/queries/overview";
import { formatNumber, formatPercent } from "@/lib/admin/format";

/** Ordinal funnel: one hue, stepping down in lightness as the stage deepens (dark-surface ordinal ramp). */
const RAMP = ["#3b7bff", "#3a73ea", "#346ad6", "#2f60c2", "#2a56ad"];

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const first = steps[0]?.count ?? 0;

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1]!.count : null;
        const ofTotal = first > 0 ? step.count / first : 0;
        const stepConv = prev !== null ? (prev > 0 ? Math.min(1, step.count / prev) : 0) : null;
        return (
          <li key={step.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="font-mono text-[11px] text-mute">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate text-fg">{step.label}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-3 tabular-nums">
                <span className="font-medium text-fg">{formatNumber(step.count)}</span>
                <span className="w-12 text-right text-[12px] text-dim">{formatPercent(ofTotal, 1)}</span>
              </span>
            </div>
            <div className="relative h-7 w-full overflow-hidden rounded-lg bg-white/[0.03]">
              <div
                className="h-full rounded-lg"
                style={{ width: `${Math.max(step.count > 0 ? 1 : 0, ofTotal * 100)}%`, backgroundColor: RAMP[i] ?? RAMP[RAMP.length - 1] }}
              />
            </div>
            {stepConv !== null ? (
              <p className="mt-1 text-[11.5px] text-mute">
                <span className="text-dim tabular-nums">{formatPercent(stepConv, 1)}</span> от предыдущего шага
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
