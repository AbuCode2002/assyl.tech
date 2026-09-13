"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { StatusDot, TickRail } from "@/components/ui/hud";
import { pad2 } from "../_shared/lead-options";
import { useAlmatyClock } from "../_shared/use-almaty-clock";

/** Confirmation screen that replaces the form after a successful submit. */
export function LeadSuccess({ number, onAgain }: { number: number | null; onAgain: () => void }) {
  const t = useTranslations("contact.form.success");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { time, offset } = useAlmatyClock();
  const steps = t.raw("steps") as string[];
  const formatted = number ? `#${String(number).padStart(4, "0")}` : null;
  const accent = (chunks: ReactNode) => <span className="text-signal-gradient">{chunks}</span>;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="flex h-full flex-col p-5 sm:p-8 lg:p-10">
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 96 96" fill="none" aria-hidden className="size-20 shrink-0 text-ok sm:size-24">
          <circle cx="48" cy="48" r="46" stroke="currentColor" strokeOpacity="0.14" />
          <path
            data-check
            pathLength={1}
            d="M48 2a46 46 0 1 1 0 92a46 46 0 1 1 0-92"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="1"
            className="drop-shadow-[0_0_8px_rgb(61_255_168/0.5)]"
          />
          <path
            data-check
            pathLength={1}
            d="m31 49.5 11.5 11.5L66 37"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1"
          />
        </svg>
        <TickRail count={32} className="h-3 flex-1 items-center" />
      </div>

      <p data-success-reveal className="mono-label mt-10 text-ok">
        {t("eyebrow")}
      </p>
      <h3
        ref={headingRef}
        tabIndex={-1}
        data-success-reveal
        className="mt-4 font-display text-[clamp(30px,3.4vw,54px)] font-medium leading-[1] tracking-[-0.035em] outline-none"
      >
        {formatted ? t.rich("title", { number: formatted, accent }) : t.rich("titleNoNumber", { accent })}
      </h3>
      <p data-success-reveal className="mt-5 max-w-[48ch] text-[16px] leading-relaxed text-dim">
        {t("text")}
      </p>

      <div data-success-reveal className="mt-10">
        <span className="mono-label">{t("stepsLabel")}</span>
        <ol className="mt-4 border-t border-line">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-5 border-b border-line py-4">
              <span className="font-mono text-[11px] tabular-nums text-signal">{pad2(i + 1)}</span>
              <span className="text-[15px] leading-snug text-fg">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div data-success-reveal className="mt-10 flex flex-wrap items-center justify-between gap-6">
        <MagneticButton variant="ghost" onClick={onAgain} data-track-click="contact-send-another">
          {t("again")}
        </MagneticButton>
        <span className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
          <StatusDot color="bg-ok">{formatted}</StatusDot>
          <span className="tabular-nums">
            {time} {offset}
          </span>
        </span>
      </div>
    </div>
  );
}
