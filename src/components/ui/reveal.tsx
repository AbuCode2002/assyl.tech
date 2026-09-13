"use client";

import { useRef, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";

export type TextTag = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4";
export type TextElementProps = {
  ref?: Ref<HTMLElement>;
  className?: string;
  "aria-label"?: string;
  onMouseEnter?: () => void;
  children?: ReactNode;
};
/** Polymorphic text tag rendered through a narrow props type (avoids TS's huge intrinsic-element union). */
export type TextComponent = (props: TextElementProps) => ReactNode;

type RevealTextProps = {
  text: string;
  as?: TextTag;
  className?: string;
  /** split by words (default) or characters */
  by?: "words" | "chars";
  stagger?: number;
  delay?: number;
  /** "view" = on scroll into view, "scrub" = opacity follows scroll position */
  mode?: "view" | "scrub" | "mount";
};

/**
 * Masked text reveal: each word/char slides up from behind a clip.
 * `scrub` mode fades words from dim to bright as the paragraph scrolls through the viewport.
 */
export function RevealText({ text, as: Tag = "p", className, by = "words", stagger, delay = 0, mode = "view" }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const pieces = ref.current.querySelectorAll<HTMLElement>("[data-piece]");
      if (mode === "scrub") {
        // Discrete: light up whole words as the threshold passes them (CSS transition does the fade).
        // Scrubbing opacity of every word each frame repainted the whole paragraph 60×/s.
        let lit = -1;
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top 85%",
          end: "bottom 45%",
          onUpdate: (self) => {
            const next = Math.round(self.progress * pieces.length);
            if (next === lit) return;
            const from = Math.min(lit, next);
            const to = Math.max(lit, next);
            for (let i = Math.max(0, from); i < to && i < pieces.length; i++) pieces[i]!.dataset.lit = i < next ? "1" : "0";
            lit = next;
          },
        });
        return;
      }
      gsap.fromTo(
        pieces,
        { yPercent: 115, rotate: 4 },
        {
          yPercent: 0,
          rotate: 0,
          duration: 1.2,
          delay,
          stagger: stagger ?? (by === "chars" ? 0.018 : 0.045),
          ease: "expo.out",
          scrollTrigger: mode === "view" ? { trigger: ref.current, start: "top 88%", once: true } : undefined,
        },
      );
    },
    { scope: ref, dependencies: [text, mode] },
  );

  const tokens = by === "chars" ? Array.from(text) : text.split(/(\s+)/);
  const Comp = Tag as unknown as TextComponent;

  return (
    <Comp ref={ref} className={className} aria-label={text}>
      {tokens.map((tok, i) =>
        /^\s+$/.test(tok) ? (
          " "
        ) : tok === "\n" ? (
          <br key={i} />
        ) : mode === "scrub" ? (
          <span
            key={i}
            data-piece
            aria-hidden
            className="inline-block opacity-[0.14] transition-opacity duration-500 data-[lit=1]:opacity-100 motion-reduce:opacity-100"
          >
            {tok}
          </span>
        ) : (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span data-piece className="inline-block origin-bottom-left">
              {tok === " " ? " " : tok}
            </span>
          </span>
        ),
      )}
    </Comp>
  );
}

/** Fade + lift any block when it enters the viewport. */
export function FadeIn({ children, className, delay = 0, y = 40 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration: 1.4, delay, scrollTrigger: { trigger: ref.current, start: "top 90%", once: true } },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
