"use client";

import { useRef, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

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
        gsap.fromTo(
          pieces,
          { opacity: 0.12 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: { trigger: ref.current, start: "top 85%", end: "bottom 45%", scrub: true },
          },
        );
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
          <span key={i} data-piece aria-hidden className="inline-block">
            {tok}
          </span>
        ) : (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span data-piece className="inline-block origin-bottom-left will-change-transform">
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
