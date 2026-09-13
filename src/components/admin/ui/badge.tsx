import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "signal" | "ion" | "ok" | "warn" | "danger" | "plasma";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-graphite text-dim",
  signal: "border-signal/30 bg-signal/10 text-[#8fb3ff]",
  ion: "border-ion/25 bg-ion/10 text-ion",
  ok: "border-ok/25 bg-ok/10 text-ok",
  warn: "border-warn/25 bg-warn/10 text-warn",
  danger: "border-danger/30 bg-danger/10 text-danger",
  plasma: "border-plasma/30 bg-plasma/10 text-[#c2a6ff]",
};

export function Badge({
  tone = "neutral",
  dot,
  pulse,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[12px] leading-none font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot ? <LiveDot pulse={pulse} /> : null}
      {children}
    </span>
  );
}

export function LiveDot({ pulse, className, style }: { pulse?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span className={cn("relative inline-flex size-1.5 shrink-0", className)} style={style}>
      {pulse ? <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" /> : null}
      <span className="relative inline-flex size-1.5 rounded-full bg-current" />
    </span>
  );
}

/** Small neutral chip (services, tags). */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border border-line bg-graphite px-2 text-[12px] whitespace-nowrap text-dim",
        className,
      )}
    >
      {children}
    </span>
  );
}
