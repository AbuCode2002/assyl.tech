import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Four L-shaped corner brackets around a box. Parent must be `relative`. */
export function HudCorners({ className, size = 10, color = "border-fg/40" }: { className?: string; size?: number; color?: string }) {
  const s = { width: size, height: size };
  const base = cn("pointer-events-none absolute", color);
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <span style={s} className={cn(base, "left-0 top-0 border-l border-t")} />
      <span style={s} className={cn(base, "right-0 top-0 border-r border-t")} />
      <span style={s} className={cn(base, "bottom-0 left-0 border-b border-l")} />
      <span style={s} className={cn(base, "bottom-0 right-0 border-b border-r")} />
    </span>
  );
}

/** `[02] ── SERVICES` style section eyebrow. */
export function SectionEyebrow({ index, children, className }: { index: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("mono-label flex items-center gap-3", className)}>
      <span className="text-signal">[{index}]</span>
      <span className="h-px w-10 bg-line-strong" />
      <span>{children}</span>
    </div>
  );
}

/** Small blinking status dot + label, e.g. "● ONLINE". */
export function StatusDot({ children, color = "bg-ok", className }: { children?: ReactNode; color?: string; className?: string }) {
  return (
    <span className={cn("mono-label inline-flex items-center gap-2", className)}>
      <span className="relative flex size-1.5">
        <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", color)} />
        <span className={cn("relative inline-flex size-1.5 rounded-full", color)} />
      </span>
      {children}
    </span>
  );
}

/** Ruler of tick marks, used as decorative rails. */
export function TickRail({ count = 40, className, vertical = false }: { count?: number; className?: string; vertical?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none flex justify-between", vertical ? "flex-col" : "flex-row", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            "bg-fg/20",
            vertical ? (i % 5 === 0 ? "h-px w-3" : "h-px w-1.5") : i % 5 === 0 ? "h-3 w-px" : "h-1.5 w-px",
          )}
        />
      ))}
    </div>
  );
}
