"use client";

import { Fragment, useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

type Token = { text: string; accent: boolean; space: boolean };

/** "Избранные [работы]" → words, bracketed part flagged as accent. */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const re = /\[([^\]]*)\]/g;
  let last = 0;
  const push = (chunk: string, accent: boolean) => {
    for (const part of chunk.split(/(\s+)/)) {
      if (!part) continue;
      tokens.push({ text: part, accent, space: /^\s+$/.test(part) });
    }
  };
  for (let m = re.exec(input); m; m = re.exec(input)) {
    if (m.index > last) push(input.slice(last, m.index), false);
    push(m[1] ?? "", true);
    last = m.index + m[0].length;
  }
  if (last < input.length) push(input.slice(last), false);
  return tokens;
}

export const stripAccent = (input: string) => input.replace(/[[\]]/g, "");

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  accentClassName?: string;
  delay?: number;
  stagger?: number;
  start?: string;
};

/**
 * Display heading whose words rise out of per-word masks when scrolled into view.
 * Wrap the highlighted part of the message in [brackets] to paint it with the signal gradient.
 */
export function SplitHeading({
  text,
  as = "h2",
  className,
  accentClassName = "text-signal-gradient",
  delay = 0,
  stagger = 0.07,
  start = "top 85%",
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  // one intrinsic type for the ref; the rendered tag still follows `as`
  const Tag = as as "h2";

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el.querySelectorAll("[data-word]"),
        { yPercent: 120, rotate: 6 },
        {
          yPercent: 0,
          rotate: 0,
          duration: 1.3,
          delay,
          stagger,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    },
    { scope: ref, dependencies: [text] },
  );

  const tokens = tokenize(text);

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{stripAccent(text)}</span>
      <span aria-hidden>
        {tokens.map((tok, i) =>
          tok.space ? (
            <Fragment key={i}> </Fragment>
          ) : (
            <span key={i} className="-mb-[0.16em] -mt-[0.1em] inline-block overflow-hidden pb-[0.16em] pt-[0.1em] align-bottom">
              <span
                data-word
                className={cn("inline-block origin-bottom-left will-change-transform", tok.accent && accentClassName)}
              >
                {tok.text}
              </span>
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
