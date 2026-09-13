"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TextComponent, TextTag } from "./reveal";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#01АБВЖЗЛЯҚӘ§░▒▓";

type Props = {
  text: string;
  as?: TextTag;
  className?: string;
  /** decode when the element scrolls into view (default) */
  trigger?: "view" | "mount" | "hover" | "none";
  /** re-scramble on hover in addition to the trigger */
  hover?: boolean;
  duration?: number;
  delay?: number;
};

/** Cyber "decode" effect: random glyphs resolve left-to-right into the final text. */
export function ScrambleText({ text, as: Tag = "span", className, trigger = "view", hover = false, duration = 900, delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef<number>(0);
  const [output, setOutput] = useState(trigger === "none" || trigger === "hover" ? text : " ");

  const run = useCallback(() => {
    cancelAnimationFrame(frame.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOutput(text);
      return;
    }
    const start = performance.now() + delay;
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      const revealed = Math.floor(t * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]!;
        if (i < revealed || ch === " ") s += ch;
        else if (now < start) s += i < 1 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : " ";
        else s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setOutput(s);
      if (t < 1) frame.current = requestAnimationFrame(step);
      else setOutput(text);
    };
    frame.current = requestAnimationFrame(step);
  }, [text, duration, delay]);

  useEffect(() => {
    if (trigger === "mount") {
      const id = requestAnimationFrame(run);
      return () => cancelAnimationFrame(id);
    }
    if (trigger !== "view" || !ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [trigger, run]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const Comp = Tag as unknown as TextComponent;
  return (
    <Comp ref={ref} className={className} aria-label={text} onMouseEnter={hover || trigger === "hover" ? run : undefined}>
      <span aria-hidden>{output}</span>
    </Comp>
  );
}
