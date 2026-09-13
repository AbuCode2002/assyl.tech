"use client";

import { useEffect, useRef } from "react";

/**
 * Trailing ring cursor for fine pointers. Grows over interactive elements and shows
 * a label from `data-cursor="…"`. The native cursor stays visible for usability.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ring.current!;
    let x = -100,
      y = -100,
      tx = -100,
      ty = -100,
      scale = 1,
      targetScale = 1,
      raf = 0,
      visible = false;

    const loop = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      scale += (targetScale - scale) * 0.15;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        x = tx;
        y = ty;
        el.style.opacity = "1";
      }
      const target = (e.target as HTMLElement).closest<HTMLElement>("a, button, [role=button], [data-cursor], input, textarea, select, label");
      const text = target?.dataset.cursor;
      if (text) {
        targetScale = 2.6;
        el.dataset.mode = "label";
        if (label.current) label.current.textContent = text;
      } else if (target && !target.matches("input, textarea, select")) {
        targetScale = 1.7;
        el.dataset.mode = "hover";
      } else {
        targetScale = target ? 0.6 : 1;
        el.dataset.mode = "";
      }
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };
    const onDown = () => (targetScale *= 0.8);
    const onUp = () => (targetScale /= 0.8);

    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      data-mode=""
      className="group/cursor pointer-events-none fixed left-0 top-0 z-[95] hidden size-9 items-center justify-center rounded-full border border-fg/50 opacity-0 mix-blend-difference transition-[background-color,border-color,opacity] duration-300 data-[mode=hover]:border-fg data-[mode=label]:border-transparent data-[mode=label]:bg-fg [@media(pointer:fine)]:flex"
    >
      <span
        ref={label}
        className="font-mono text-[4px] uppercase tracking-[0.12em] text-void opacity-0 transition-opacity duration-200 group-data-[mode=label]/cursor:opacity-100"
      />
    </div>
  );
}
