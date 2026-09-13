"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01АБВЖЗЛЯҚӘ§░▒▓";
const KEEP = new Set([" ", "·", ".", ",", "—", "-"]);

/**
 * Glyph "decode" that runs each time `play` changes (e.g. a hover counter).
 * The real text keeps the layout box; the scrambled copy is painted on top, so nothing reflows.
 */
export function ScrambleOverlay({
  text,
  play,
  duration = 650,
  className,
}: {
  text: string;
  play: number;
  duration?: number;
  className?: string;
}) {
  const [frame, setFrame] = useState<string | null>(null);

  useEffect(() => {
    if (!play || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = Array.from(text);
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      if (t >= 1) {
        setFrame(null);
        return;
      }
      const revealed = Math.floor(t * chars.length);
      setFrame(
        chars
          .map((ch, i) => (i < revealed || KEEP.has(ch) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(""),
      );
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [play, text, duration]);

  return (
    <span className={cn("relative inline-block", className)}>
      <span className={frame ? "opacity-0" : undefined}>{text}</span>
      {frame && (
        <span aria-hidden className="absolute inset-0">
          {frame}
        </span>
      )}
    </span>
  );
}
