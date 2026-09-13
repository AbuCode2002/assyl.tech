import { cn } from "@/lib/cn";
import { pad2 } from "./lead-options";

/** Rolling two-digit counter: a clipped column of numbers that slides to `value` (1-based). */
export function Odometer({ value, max, className }: { value: number; max: number; className?: string }) {
  const safe = Math.min(Math.max(value, 1), Math.max(max, 1));
  return (
    <span className={cn("relative inline-block h-[1em] overflow-hidden align-bottom leading-none tabular-nums", className)}>
      <span className="sr-only">{pad2(safe)}</span>
      <span
        aria-hidden
        className="flex flex-col transition-transform duration-700 ease-out-expo motion-reduce:transition-none"
        style={{ transform: `translate3d(0, ${-(safe - 1)}em, 0)` }}
      >
        {Array.from({ length: Math.max(max, 1) }, (_, i) => (
          <span key={i} className="block h-[1em] leading-none">
            {pad2(i + 1)}
          </span>
        ))}
      </span>
    </span>
  );
}
