"use client";

import { useTranslations } from "next-intl";
import { useScrollTo } from "@/components/providers/smooth-scroll";
import { ArrowIcon, MagneticButton } from "@/components/ui/magnetic-button";
import { StatusDot } from "@/components/ui/hud";
import { SplitHeading } from "../_shared/split-heading";
import { useAlmatyClock } from "../_shared/use-almaty-clock";

export function FooterCta() {
  const t = useTranslations("footer.cta");
  const scrollTo = useScrollTo();

  return (
    <div className="relative isolate overflow-clip">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute bottom-[-60%] left-1/2 h-[120%] w-[110%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(59_123_255/0.2),rgb(90_92_255/0.06)_55%,transparent)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:100%_64px] [mask-image:linear-gradient(180deg,transparent,#000_40%,#000_80%,transparent)]" />
      </div>

      <div className="container-x grid gap-10 py-[clamp(88px,12vw,180px)] lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="mono-label flex items-center gap-3">
            <StatusDot color="bg-ion" />
            {t("eyebrow")}
          </p>
          <SplitHeading
            text={t("title")}
            className="mt-8 font-display text-[clamp(40px,6.8vw,124px)] font-medium leading-[0.92] tracking-[-0.045em]"
          />
        </div>
        <div className="flex flex-col items-start gap-8 lg:col-span-4 lg:items-end lg:text-right">
          <p className="max-w-[36ch] text-[clamp(15px,1.2vw,18px)] leading-relaxed text-dim">{t("text")}</p>
          <MagneticButton
            href="#contact"
            size="lg"
            icon={<ArrowIcon />}
            data-track-click="cta-footer"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#contact");
            }}
          >
            {t("button")}
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}

export function FooterClock({ label }: { label: string }) {
  const { time, offset } = useAlmatyClock();
  return (
    <p className="flex flex-col gap-1">
      <span className="mono-label text-mute">{label}</span>
      <span className="font-mono text-[15px] tabular-nums text-fg">
        {time} <span className="text-[10px] tracking-[0.1em] text-mute">{offset}</span>
      </span>
    </p>
  );
}

export function BackToTop({ label }: { label: string }) {
  const scrollTo = useScrollTo();
  return (
    <button
      type="button"
      onClick={() => scrollTo(0)}
      data-track-click="footer-top"
      className="group/top inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dim transition-colors duration-300 hover:text-fg"
    >
      {label}
      <span className="grid size-9 place-items-center overflow-hidden rounded-full border border-line-strong transition-[background-color,border-color,color] duration-500 group-hover/top:border-fg group-hover/top:bg-fg group-hover/top:text-void">
        <span className="relative block size-3.5 overflow-hidden">
          <svg aria-hidden viewBox="0 0 14 14" fill="none" className="absolute inset-0 size-3.5 transition-transform duration-500 ease-out-expo group-hover/top:-translate-y-full">
            <path d="M7 12V2M2.5 6.5 7 2l4.5 4.5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <svg aria-hidden viewBox="0 0 14 14" fill="none" className="absolute inset-0 size-3.5 translate-y-full transition-transform duration-500 ease-out-expo group-hover/top:translate-y-0">
            <path d="M7 12V2M2.5 6.5 7 2l4.5 4.5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </span>
      </span>
    </button>
  );
}
