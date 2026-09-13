"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Card whose border and surface light up under the cursor. */
export function SpotlightCard({ children, className, glow = "59 123 255" }: { children: ReactNode; className?: string; glow?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      style={{ ["--glow" as string]: glow }}
      className={cn(
        "group/spot relative overflow-hidden rounded-2xl border border-line bg-carbon/80",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100",
        "before:[background:radial-gradient(420px_circle_at_var(--mx)_var(--my),rgb(var(--glow)/0.14),transparent_45%)]",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:p-px after:opacity-0 after:transition-opacity after:duration-500 hover:after:opacity-100",
        "after:[background:radial-gradient(280px_circle_at_var(--mx)_var(--my),rgb(var(--glow)/0.8),transparent_60%)]",
        "after:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
