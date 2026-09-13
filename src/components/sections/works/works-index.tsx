"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { TickRail } from "@/components/ui/hud";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { pad2 } from "../_shared/lead-options";
import { Odometer } from "../_shared/odometer";
import { ScrambleOverlay } from "../_shared/scramble-overlay";
import { CaseModal } from "./case-modal";
import type { WorkItem } from "./types";
import { WorkCard } from "./work-card";

/**
 * Asymmetric case index. Phone projects are narrow cards that interlock when two follow each
 * other (left / right, second one pulled up); web projects are wide. Works for any N.
 */
function layoutFor(items: WorkItem[]) {
  return items.map((item, i) => {
    const narrow = item.platform === "mobile";
    const prevNarrow = i > 0 && items[i - 1]!.platform === "mobile";
    const right = i % 2 === 1;
    return {
      right,
      speed: narrow ? (right ? 1.5 : 0.9) : 0.55,
      className: cn(
        narrow ? "lg:w-[46%]" : "lg:w-[76%]",
        right ? "lg:self-end" : "lg:self-start",
        narrow && prevNarrow && "lg:mt-[calc(-31%_-_90px_-_clamp(72px,10vw,160px))]",
      ),
    };
  });
}

export function WorksIndex({ items }: { items: WorkItem[] }) {
  const t = useTranslations("works");
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const total = items.length;
  const layout = layoutFor(items);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-work-card]");

      cards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top 60%",
          end: "bottom 40%",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        });
      });

      if (prefersReducedMotion()) return;

      cards.forEach((card) => {
        const stage = card.querySelector("[data-stage]");
        const media = card.querySelector("[data-media]");
        const reveal = card.querySelectorAll("[data-reveal]");
        gsap
          .timeline({ scrollTrigger: { trigger: card, start: "top 88%", once: true } })
          .fromTo(
            stage,
            { clipPath: "inset(14% 10% 0% 10% round 16px)" },
            { clipPath: "inset(0% 0% 0% 0% round 16px)", duration: 1.5, ease: "expo.out", clearProps: "clipPath" },
            0,
          )
          .fromTo(media, { scale: 1.2, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 1.7, ease: "expo.out", clearProps: "transform" }, 0)
          .fromTo(reveal, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: "expo.out" }, 0.25);
      });

      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        cards.forEach((card) => {
          const speed = Number(card.dataset.speed ?? 1);
          gsap.fromTo(
            card.querySelector("[data-parallax]"),
            { y: 70 * speed },
            {
              y: -70 * speed,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
        gsap.fromTo(
          "[data-rail-fill]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: "[data-work-list]", start: "top 60%", end: "bottom 60%", scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [total] },
  );

  const current = items[active] ?? items[0];

  return (
    <div ref={root} className="relative mt-[clamp(64px,9vw,140px)] lg:grid lg:grid-cols-[168px_minmax(0,1fr)] lg:gap-12 xl:gap-16">
      {/* sticky index readout (visual duplicate of card info) */}
      <aside aria-hidden className="hidden lg:block">
        <div className="sticky top-[26vh] flex flex-col gap-7">
          <span className="mono-label">{t("indexLabel")}</span>

          <div className="flex items-end gap-2 font-mono text-[13px] text-dim">
            <span className="pb-1">[</span>
            <Odometer value={active + 1} max={total} className="font-display text-[52px] font-medium tracking-[-0.04em] text-fg" />
            <span className="pb-1">/ {pad2(total)} ]</span>
          </div>

          <div className="flex h-[24vh] gap-4">
            <div className="relative w-px overflow-hidden bg-line">
              <span data-rail-fill className="absolute inset-0 origin-top scale-y-0 bg-linear-to-b from-signal to-ion" />
            </div>
            <TickRail vertical count={25} className="h-full" />
            <ol className="flex flex-col justify-between py-px font-mono text-[10px] tracking-[0.16em]">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 transition-colors duration-500",
                    i === active ? "text-fg" : "text-mute",
                  )}
                >
                  <span
                    className={cn(
                      "h-px bg-ion transition-[width] duration-500 ease-out-expo",
                      i === active ? "w-4" : "w-0",
                    )}
                  />
                  {pad2(i + 1)}
                </li>
              ))}
            </ol>
          </div>

          {current && (
            <div className="flex flex-col gap-2 border-t border-line pt-5">
              <span className="mono-label text-mute">{t("current")}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg">
                <ScrambleOverlay text={current.title} play={active + 1} />
              </span>
              <span className="mono-label">{current.category}</span>
            </div>
          )}
        </div>
      </aside>

      <ol data-work-list className="flex flex-col gap-[clamp(72px,10vw,160px)]">
        {items.map((item, i) => (
          <WorkCard
            key={item.id}
            item={item}
            index={i}
            total={total}
            speed={layout[i]!.speed}
            className={layout[i]!.className}
            onOpen={setOpen}
          />
        ))}
      </ol>

      {open !== null && items[open] && (
        <CaseModal items={items} index={open} onNavigate={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
