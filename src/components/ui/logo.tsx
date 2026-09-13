import { useId } from "react";
import { cn } from "@/lib/cn";
import { BRACKET_STROKE, LOGO_PATHS } from "./logo-paths";

/** assyl.tech "A" mark — white A, blue swoosh, code brackets. viewBox 620×420 */
export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const id = useId().replace(/:/g, "");
  const blue = mono ? "currentColor" : `url(#sw-${id})`;
  return (
    <svg viewBox="0 0 620 420" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient id={`sw-${id}`} x1="0" y1="400" x2="430" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5a5cff" />
          <stop offset="1" stopColor="#3b82ff" />
        </linearGradient>
      </defs>
      <path d={LOGO_PATHS.leftLeg} fill="currentColor" />
      <path d={LOGO_PATHS.rightLeg} fill="currentColor" />
      <path d={LOGO_PATHS.swoosh} fill={blue} />
      <path
        d={LOGO_PATHS.brackets}
        stroke={mono ? "currentColor" : "#4c6ef5"}
        strokeWidth={BRACKET_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-semibold tracking-[-0.02em]", className)}>
      assyl<span className="text-signal">.tech</span>
    </span>
  );
}
