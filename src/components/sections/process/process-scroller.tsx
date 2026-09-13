"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { HudCorners, SectionEyebrow, TickRail } from "@/components/ui/hud";
import { cn } from "@/lib/cn";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { pad2 } from "../_shared/lead-options";
import { Odometer } from "../_shared/odometer";
import { SplitHeading } from "../_shared/split-heading";

type Step = { title: string; description: string; deliverables: string[]; duration: string };

const EDGE = "max(clamp(20px,4vw,56px), calc((100vw - 1440px) / 2 + clamp(20px,4vw,56px)))";

/**
 * Desktop (≥768px): the frame pins and the step track scrolls horizontally (scrubbed), with a
 * light beam + tick rail tracking progress. Mobile: vertical timeline with a beam drawn on the left.
 * Reduced motion: no pin, every step shown as active, native horizontal scroll on desktop.
 */
export function ProcessScroller() {
  const t = useTranslations("process");
  const steps = t.raw("steps") as Step[];
  const n = steps.length;
  const root = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [isStatic, setIsStatic] = useState(false);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = (sel: string) => el.querySelector<HTMLElement>(sel);
      const setIndex = (i: number) => {
        if (activeRef.current === i) return;
        activeRef.current = i;
        setActive(i);
      };

      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 768px)",
          mobile: "(max-width: 767.98px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { desktop, reduce } = ctx.conditions as { desktop: boolean; mobile: boolean; reduce: boolean };
          const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", el);

          if (reduce) {
            setIsStatic(true);
            return () => setIsStatic(false);
          }

          if (desktop) {
            const frame = q("[data-frame]");
            const viewport = q("[data-viewport]");
            const track = q("[data-track]");
            if (!frame || !viewport || !track) return;
            gsap.set(viewport, { overflowX: "hidden" });
            const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

            const tl = gsap.timeline({
              defaults: { ease: "none", duration: 1 },
              scrollTrigger: {
                trigger: frame,
                start: "top top",
                end: () => `+=${Math.max(distance(), window.innerHeight * 0.6)}`,
                pin: true,
                scrub: 0.7,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => setIndex(Math.min(n - 1, Math.round(self.progress * (n - 1)))),
              },
            });
            tl.fromTo(track, { x: 0 }, { x: () => -distance() }, 0)
              .fromTo("[data-beam-fill]", { scaleX: 0 }, { scaleX: 1 }, 0)
              .fromTo("[data-beam-head]", { xPercent: 0 }, { xPercent: 100 }, 0);

            panels.forEach((panel) => {
              const num = panel.querySelector("[data-num]");
              if (!num) return;
              gsap.fromTo(
                num,
                { xPercent: 16 },
                {
                  xPercent: -16,
                  ease: "none",
                  scrollTrigger: { trigger: panel, containerAnimation: tl, start: "left right", end: "right left", scrub: true },
                },
              );
            });
            return;
          }

          // mobile timeline
          const list = q("[data-track]");
          const beam = { trigger: list, start: "top 70%", end: "bottom 70%", scrub: true };
          gsap.fromTo("[data-vbeam-fill]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: beam });
          gsap.fromTo("[data-vbeam-head]", { yPercent: 0 }, { yPercent: 100, ease: "none", scrollTrigger: beam });
          panels.forEach((panel, i) => {
            ScrollTrigger.create({
              trigger: panel,
              start: "top 70%",
              end: "bottom 70%",
              onToggle: (self) => {
                if (self.isActive) setIndex(i);
              },
            });
            gsap.fromTo(
              panel,
              { y: 56, opacity: 0 },
              { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: panel, start: "top 90%", once: true } },
            );
          });
        },
      );
      return () => mm.revert();
    },
    { scope: root, dependencies: [n] },
  );

  return (
    <div ref={root} data-static={isStatic || undefined} className="group/process">
      <div data-frame className="relative md:flex md:h-svh md:min-h-[640px] md:flex-col md:overflow-hidden">
        {/* ambience */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[55%] h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(59_123_255/0.10),transparent)]" />
          <div className="absolute inset-0 [background-image:linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] [background-size:calc(100%/12)_100%] [mask-image:linear-gradient(180deg,transparent,#000_30%,#000_70%,transparent)]" />
        </div>

        <div className="container-x relative pt-[clamp(96px,14vw,200px)] md:pt-[clamp(88px,12vh,140px)]">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
            <div>
              <SectionEyebrow index="06">{t("eyebrow")}</SectionEyebrow>
              <SplitHeading
                text={t("title")}
                className="mt-6 font-display text-[clamp(36px,5vw,88px)] font-medium leading-[0.95] tracking-[-0.03em] md:mt-8"
              />
            </div>
            <div className="flex max-w-[400px] flex-col gap-5 md:items-end md:text-right">
              <p className="text-[clamp(15px,1.15vw,17px)] leading-relaxed text-dim">{t("intro")}</p>
              <div aria-hidden className="hidden items-center gap-3 font-mono text-[12px] uppercase tracking-[0.16em] text-dim md:flex">
                <span>{t("step")}</span>
                <Odometer value={active + 1} max={n} className="text-fg" />
                <span className="text-mute">/ {pad2(n)}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          data-viewport
          style={{ "--edge": EDGE } as CSSProperties}
          className="relative mt-12 md:mt-[clamp(28px,5vh,56px)] md:min-h-0 md:flex-1 md:overflow-x-auto md:[scrollbar-width:none]"
        >
          {/* mobile beam */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[clamp(96px,14vw,200px)] left-[calc(var(--edge)+7px)] top-0 w-px bg-line md:hidden"
          >
            <span data-vbeam-fill className="absolute inset-0 origin-top scale-y-0 bg-linear-to-b from-signal to-ion group-data-[static]/process:scale-y-100" />
            <span data-vbeam-head className="absolute inset-0 group-data-[static]/process:hidden">
              <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ion shadow-[0_0_14px_3px_rgb(86_225_255/0.7)]" />
            </span>
          </div>

          <ol
            data-track
            className="relative flex flex-col gap-5 px-[var(--edge)] pb-[clamp(96px,14vw,200px)] md:h-full md:w-max md:flex-row md:gap-5 md:pb-0"
          >
            {steps.map((step, i) => (
              <li
                key={i}
                data-panel
                data-active={i === active ? "true" : undefined}
                className="glass group/panel relative ml-8 flex flex-col p-6 sm:p-7 md:ml-0 md:w-[clamp(300px,33vw,470px)] md:p-8"
              >
                {/* timeline node (mobile) */}
                <span
                  aria-hidden
                  className="absolute -left-8 top-7 grid size-[15px] place-items-center rounded-full border border-line-strong bg-void md:hidden"
                >
                  <span className="size-[5px] rounded-full bg-mute transition-[background-color,box-shadow] duration-500 group-data-[active]/panel:bg-ion group-data-[active]/panel:shadow-[0_0_10px_2px_rgb(86_225_255/0.7)] group-data-[static]/process:bg-ion" />
                </span>

                <HudCorners size={10} className="-inset-px" color="border-fg/30" />
                <span
                  aria-hidden
                  className="absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-linear-to-r from-signal via-ion to-transparent transition-transform duration-[1200ms] ease-out-expo group-data-[active]/panel:scale-x-100 group-data-[static]/process:scale-x-100"
                />

                <div className="flex items-center justify-between gap-4">
                  <span className="mono-label">
                    {t("step")} <span className="tabular-nums text-fg">{pad2(i + 1)}</span>
                  </span>
                  <span className="rounded-full border border-line-strong px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fg/85">
                    <span className="sr-only">{t("duration")}: </span>
                    {step.duration}
                  </span>
                </div>

                <div aria-hidden className="relative my-6 overflow-hidden md:my-4 md:flex md:flex-1 md:items-center">
                  <span data-num className="relative block font-display text-[clamp(84px,9vw,164px)] font-semibold leading-[0.9] tracking-[-0.05em] tabular-nums">
                    <span className="text-outline">{pad2(i + 1)}</span>
                    <span className="text-signal-gradient absolute inset-0 transition-[clip-path] duration-[1200ms] ease-out-expo [clip-path:inset(0_100%_0_0)] group-data-[active]/panel:[clip-path:inset(0_0%_0_0)] group-data-[static]/process:[clip-path:inset(0_0%_0_0)]">
                      {pad2(i + 1)}
                    </span>
                  </span>
                </div>

                <h3 className="font-display text-[clamp(20px,1.7vw,28px)] font-medium leading-[1.1] tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-dim">{step.description}</p>

                <div className="mt-5 border-t border-line pt-4 md:[@media(max-height:800px)]:hidden">
                  <span className="mono-label">{t("output")}</span>
                  <ul className="mt-3 flex flex-col gap-2">
                    {step.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-3 text-[14px] leading-snug text-fg/85">
                        <span aria-hidden className="mt-[7px] size-1 shrink-0 bg-ion/70" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* desktop beam */}
        <div aria-hidden className="container-x relative hidden pb-[clamp(24px,5vh,48px)] pt-[clamp(20px,3.5vh,36px)] md:block">
          <div className="mb-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "tabular-nums transition-colors duration-500",
                  i <= active || isStatic ? "text-fg" : "text-mute",
                )}
              >
                {pad2(i + 1)}
              </span>
            ))}
          </div>
          <div className="relative h-px bg-line">
            <span data-beam-fill className="absolute inset-0 origin-left scale-x-0 bg-linear-to-r from-signal to-ion group-data-[static]/process:scale-x-100" />
            <span data-beam-head className="absolute inset-0 group-data-[static]/process:hidden">
              <span className="absolute left-0 top-1/2 h-[2px] w-40 -translate-x-full -translate-y-1/2 bg-linear-to-r from-transparent to-ion/70" />
              <span className="absolute left-0 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ion shadow-[0_0_16px_4px_rgb(86_225_255/0.7)]" />
            </span>
          </div>
          <TickRail count={81} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
