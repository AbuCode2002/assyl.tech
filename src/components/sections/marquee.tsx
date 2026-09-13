"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";

function Row({ items, reverse, big }: { items: string[]; reverse?: boolean; big?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="flex overflow-hidden">
      <div
        className={cn("flex w-max shrink-0 animate-marquee items-center", reverse && "[animation-direction:reverse]")}
        style={{ ["--marquee-duration" as string]: big ? "60s" : "45s" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center" aria-hidden={i >= items.length}>
            <span
              className={cn(
                big
                  ? cn(
                      "px-[clamp(16px,2.5vw,40px)] font-display text-[clamp(40px,7vw,112px)] font-medium leading-none tracking-[-0.03em]",
                      i % 2 ? "text-outline" : "text-fg",
                    )
                  : "px-6 font-mono text-[12px] uppercase tracking-[0.2em] text-dim",
              )}
            >
              {item}
            </span>
            <span className={cn(big ? "text-[clamp(18px,2vw,32px)] text-signal" : "text-[10px] text-mute")}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Marquee() {
  const t = useTranslations("about");
  const root = useRef<HTMLDivElement>(null);
  const big = t.raw("marquee") as string[];
  const small = t.raw("marqueeSmall") as string[];

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const skew = gsap.quickTo(root.current!.querySelectorAll("[data-skew]"), "skewX", { duration: 0.6, ease: "power3.out" });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => skew(gsap.utils.clamp(-12, 12, self.getVelocity() / -250)),
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative flex flex-col gap-6 overflow-hidden border-y border-line bg-ink py-10" aria-label={big.join(", ")}>
      <div data-skew>
        <Row items={big} big />
      </div>
      <div data-skew>
        <Row items={small} reverse />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[12vw] bg-gradient-to-r from-ink to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[12vw] bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
