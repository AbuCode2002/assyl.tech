import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Slim phone shell for 540×1200 screen recordings. Give it a height; width follows the ratio. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[9/20] rounded-[36px] bg-[linear-gradient(160deg,#2a3142_0%,#10141d_38%,#0a0d14_70%,#1d2331_100%)] p-[5px]",
        // hairline only: an 80px blurred drop shadow was re-rasterised on every frame of the card
        // reveal/parallax transforms (measured 6 dropped frames → 0) and is invisible on the dark stage anyway
        "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]",
        className,
      )}
    >
      {/* side keys */}
      <span aria-hidden className="absolute -left-[2px] top-[20%] h-[7%] w-[2px] rounded-l-sm bg-[#252b3a]" />
      <span aria-hidden className="absolute -left-[2px] top-[29%] h-[11%] w-[2px] rounded-l-sm bg-[#252b3a]" />
      <span aria-hidden className="absolute -right-[2px] top-[25%] h-[14%] w-[2px] rounded-r-sm bg-[#252b3a]" />
      <div className="relative size-full overflow-hidden rounded-[31px] bg-black">
        {children}
        {/* dynamic island */}
        <span aria-hidden className="absolute left-1/2 top-[1.6%] h-[3.2%] w-[31%] -translate-x-1/2 rounded-full bg-black" />
        {/* glass glare */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(125deg,rgb(255_255_255/0.08)_0%,transparent_32%,transparent_70%,rgb(255_255_255/0.03)_100%)]"
        />
      </div>
    </div>
  );
}

/** Minimal browser window: three dots and a URL bar. Width is set by the parent. */
export function BrowserFrame({
  children,
  url,
  className,
  style,
}: {
  children: ReactNode;
  url: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden rounded-[10px] border border-line-strong bg-ink sm:rounded-xl",
        className,
      )}
    >
      <div className="flex h-7 items-center gap-3 border-b border-line bg-graphite/90 px-3 sm:h-8">
        <span aria-hidden className="flex shrink-0 gap-1.5">
          <span className="size-2 rounded-full bg-fg/20" />
          <span className="size-2 rounded-full bg-fg/12" />
          <span className="size-2 rounded-full bg-fg/12" />
        </span>
        <span className="mx-auto flex h-[18px] min-w-0 max-w-[62%] flex-1 items-center justify-center gap-1.5 rounded-md bg-void/70 px-3 font-mono text-[9px] tracking-[0.04em] text-dim sm:h-5 sm:text-[10px]">
          <svg aria-hidden viewBox="0 0 12 12" className="size-2.5 shrink-0 text-ion/80" fill="none">
            <rect x="2.5" y="5.5" width="7" height="5" rx="1" stroke="currentColor" />
            <path d="M4 5.5V4a2 2 0 1 1 4 0v1.5" stroke="currentColor" />
          </svg>
          <span className="truncate">{url}</span>
        </span>
        <span aria-hidden className="w-[34px] shrink-0" />
      </div>
      <div className="relative aspect-[1280/672] bg-black">{children}</div>
    </div>
  );
}

/** 44px grid cell as a tiny SVG tile: decoded once and tiled, unlike repeating CSS gradients. */
const GRID_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cpath d='M0 .5H44M.5 0V44' stroke='%23fff' stroke-opacity='.05'/%3E%3C/svg%3E\")";

/**
 * Faint grid + accent glow behind a device.
 * Kept deliberately cheap: repeating gradients under a mask plus a color-mix() glow cost ~150 ms of GPU
 * raster per card on integrated graphics (followed by a 400 ms present stall). Now: one image tile,
 * one plain radial gradient, and a vignette made of the same gradient type.
 */
export function StageBackdrop({ className, accent }: { className?: string; accent: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <span className="absolute inset-0 opacity-60" style={{ backgroundImage: GRID_TILE, backgroundPosition: "center" }} />
      <span
        className="absolute inset-0 opacity-70 transition-opacity duration-700 group-hover/work:opacity-100"
        style={{ background: `radial-gradient(65% 55% at 50% 55%, ${accent}38, transparent 72%), radial-gradient(90% 80% at 50% 45%, transparent 55%, #0a0d14 100%)` }}
      />
    </span>
  );
}
