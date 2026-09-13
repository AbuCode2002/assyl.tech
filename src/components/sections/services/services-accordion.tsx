"use client";

import { useRef, useState, type MouseEvent, type TransitionEvent } from "react";
import { useTranslations } from "next-intl";
import { useScrollTo } from "@/components/providers/smooth-scroll";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { requestService } from "../_shared/events";
import { pad2, SERVICE_ROWS, type ServiceRowId } from "../_shared/lead-options";
import { ServiceGlyph } from "./service-glyph";

export function ServicesAccordion({ className }: { className?: string }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<ServiceRowId | null>(null);

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list || prefersReducedMotion()) return;
      const trigger = { trigger: list, start: "top 82%", once: true };
      gsap.fromTo(
        "[data-row-line]",
        { scaleX: 0 },
        { scaleX: 1, duration: 1.6, stagger: 0.08, ease: "expo.out", scrollTrigger: trigger },
      );
      gsap.fromTo(
        "[data-row-inner]",
        { yPercent: 40, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: "expo.out", clearProps: "transform", scrollTrigger: trigger },
      );
    },
    { scope: listRef },
  );

  return (
    <ul ref={listRef} className={cn("relative", className)}>
      <li aria-hidden className="relative h-px list-none">
        <span data-row-line className="absolute inset-0 origin-left bg-line-strong" />
      </li>
      {SERVICE_ROWS.map((id, i) => (
        <ServiceRow
          key={id}
          id={id}
          index={i}
          open={open === id}
          onToggle={() => setOpen((cur) => (cur === id ? null : id))}
        />
      ))}
    </ul>
  );
}

function ServiceRow({
  id,
  index,
  open,
  onToggle,
}: {
  id: ServiceRowId;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const scrollTo = useScrollTo();
  const name = tc(`services.${id}`);
  const deliverables = t.raw(`items.${id}.deliverables`) as string[];
  const buttonId = `service-${id}-button`;
  const panelId = `service-${id}-panel`;

  const onPanelTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === "grid-template-rows") ScrollTrigger.refresh();
  };

  const discuss = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!requestService(id)) scrollTo("#contact");
  };

  return (
    <li className="relative list-none">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          data-row-inner
          data-track-click={`service-${id}`}
          className="group/row relative flex w-full items-center gap-4 overflow-hidden py-[clamp(22px,2.8vw,40px)] text-left outline-none sm:gap-6 md:gap-8 focus-visible:[&_[data-name]]:text-ion"
        >
          {/* fill sweep */}
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 bg-[linear-gradient(90deg,rgb(59_123_255/0.16),rgb(90_92_255/0.07)_55%,transparent)] transition-transform duration-[900ms] ease-out-expo group-hover/row:scale-x-100 group-focus-visible/row:scale-x-100 group-aria-expanded/row:scale-x-100"
          />
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-ion transition-transform duration-700 ease-out-expo group-hover/row:scale-y-100 group-aria-expanded/row:scale-y-100"
          />

          <span aria-hidden className="relative w-8 shrink-0 pl-2 font-mono text-[11px] tabular-nums tracking-[0.12em] text-mute transition-colors duration-500 group-hover/row:text-signal group-aria-expanded/row:text-signal sm:w-12 sm:pl-3">
            {pad2(index + 1)}
          </span>

          <span
            data-name
            className="relative min-w-0 flex-1 font-display text-[clamp(22px,3.7vw,60px)] font-medium leading-[1.02] tracking-[-0.035em] transition-[translate,color] duration-700 ease-out-expo group-hover/row:translate-x-2 md:group-hover/row:translate-x-6 group-aria-expanded/row:translate-x-2 md:group-aria-expanded/row:translate-x-6"
          >
            {name}
          </span>

          <span className="relative hidden max-w-[32ch] text-[15px] leading-snug text-dim transition-colors duration-500 group-hover/row:text-fg/80 xl:block">
            {t(`items.${id}.short`)}
          </span>

          <span
            aria-hidden
            className="relative hidden size-10 shrink-0 scale-75 text-ion opacity-0 transition-[opacity,scale] duration-500 ease-out-expo group-hover/row:scale-100 group-hover/row:opacity-100 group-aria-expanded/row:scale-100 group-aria-expanded/row:opacity-100 md:block"
          >
            <ServiceGlyph id={id} className="size-full" />
          </span>

          <span
            aria-hidden
            className="relative mr-1 grid size-10 shrink-0 place-items-center rounded-full border border-line-strong transition-[background-color,border-color,color] duration-500 group-hover/row:border-fg/50 group-aria-expanded/row:border-fg group-aria-expanded/row:bg-fg group-aria-expanded/row:text-void sm:size-12"
          >
            <span className="relative block size-3.5 transition-[rotate] duration-500 ease-out-expo group-aria-expanded/row:rotate-45">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
            </span>
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        onTransitionEnd={onPanelTransitionEnd}
        className={cn(
          "grid transition-[grid-template-rows] duration-700 ease-out-expo motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "grid gap-8 pb-10 pl-12 pr-2 pt-2 transition-[opacity,translate] duration-700 ease-out-expo sm:pl-[72px] md:grid-cols-12 md:gap-10 md:pb-14 md:pl-0",
              open ? "translate-y-0 opacity-100 delay-150" : "-translate-y-4 opacity-0",
            )}
          >
            <div className="md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-2">
              <p className="mb-4 font-display text-[17px] leading-snug text-fg xl:hidden">{t(`items.${id}.short`)}</p>
              <p className="max-w-[58ch] text-[clamp(15px,1.2vw,18px)] leading-relaxed text-dim">
                {t(`items.${id}.description`)}
              </p>
            </div>

            <div className="flex flex-col gap-7 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
              <div>
                <span className="mono-label">{t("deliverables")}</span>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {deliverables.map((d) => (
                    <li key={d} className="rounded-full border border-line-strong bg-carbon/60 px-3.5 py-1.5 text-[13px] text-fg/85">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-end justify-between gap-6 border-t border-line pt-5">
                <div>
                  <span className="mono-label">{t("timeline")}</span>
                  <p className="mt-2 font-mono text-[15px] tabular-nums text-fg">{t(`items.${id}.timeline`)}</p>
                </div>
                <a
                  href="#contact"
                  onClick={discuss}
                  aria-label={t("discussAria", { service: name })}
                  data-track-click={`service-discuss-${id}`}
                  className="group/cta relative inline-flex items-center gap-2 pb-1 font-mono text-[12px] uppercase tracking-[0.16em] text-fg"
                >
                  {t("discuss")}
                  <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover/cta:translate-x-1.5">
                    →
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px origin-left bg-linear-to-r from-signal to-ion transition-transform duration-500 ease-out-expo group-hover/cta:scale-x-[0.35]"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px">
        <span data-row-line className="absolute inset-0 origin-left bg-line-strong" />
      </span>
    </li>
  );
}
