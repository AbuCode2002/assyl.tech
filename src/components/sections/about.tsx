"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { HudCorners, SectionEyebrow, StatusDot } from "@/components/ui/hud";
import { FadeIn, RevealText } from "@/components/ui/reveal";
import { SpotlightCard } from "@/components/ui/spotlight-card";

type Capability = { title: string; text: string; tech: string };

const ICONS = [
  // mobile
  <svg key="m" viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
    <rect x="9" y="3" width="14" height="26" rx="3" stroke="currentColor" strokeWidth="1.2" />
    <path d="M14 6h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="16" cy="25" r="1" fill="currentColor" />
  </svg>,
  // web
  <svg key="w" viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
    <rect x="3" y="6" width="26" height="20" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M3 11h26M7 8.5h.01M10 8.5h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="m13 16-3 3 3 3M19 16l3 3-3 3" stroke="currentColor" strokeWidth="1.2" />
  </svg>,
  // ai
  <svg key="a" viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
    <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M16 3v6M16 23v6M3 16h6M23 16h6M6.8 6.8l4.2 4.2M21 21l4.2 4.2M6.8 25.2 11 21M21 11l4.2-4.2" stroke="currentColor" strokeWidth="1.2" />
  </svg>,
  // software
  <svg key="s" viewBox="0 0 32 32" fill="none" className="size-7" aria-hidden>
    <path d="M5 9h22M5 16h22M5 23h22" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="11" cy="9" r="2.2" fill="#0a0d14" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="21" cy="16" r="2.2" fill="#0a0d14" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="14" cy="23" r="2.2" fill="#0a0d14" stroke="currentColor" strokeWidth="1.2" />
  </svg>,
];

/** Terminal card that types its lines when scrolled into view. */
function Terminal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState<string[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        let line = 0;
        let char = 0;
        const tick = () => {
          if (line >= lines.length) return;
          char++;
          const snapshot = [...lines.slice(0, line), lines[line]!.slice(0, char)];
          setTyped(snapshot);
          if (char >= lines[line]!.length) {
            line++;
            char = 0;
            timer = setTimeout(tick, 380);
          } else timer = setTimeout(tick, line === 0 ? 38 : 16);
        };
        timer = setTimeout(tick, 300);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [lines]);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl border border-line bg-ink">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-fg/15" />
          <span className="size-2.5 rounded-full bg-fg/15" />
          <span className="size-2.5 rounded-full bg-signal" />
        </div>
        <span className="mono-label text-mute">~/assyl — zsh</span>
      </div>
      <pre className="min-h-[220px] whitespace-pre-wrap px-5 py-5 font-mono text-[13px] leading-7 text-dim">
        {typed.map((l, i) => (
          <div key={i} className={i === 0 ? "text-fg" : l.startsWith("→") ? "text-ion" : ""}>
            {i === 0 && <span className="text-signal">$ </span>}
            {l.startsWith("✓") ? (
              <>
                <span className="text-ok">✓</span>
                {l.slice(1)}
              </>
            ) : (
              l
            )}
            {i === typed.length - 1 && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-blink bg-fg/80" />}
          </div>
        ))}
      </pre>
    </div>
  );
}

export function About() {
  const t = useTranslations("about");
  const caps = t.raw("capabilities") as Capability[];

  return (
    <section id="about" data-track-section="about" className="relative overflow-hidden py-[clamp(96px,14vw,200px)]">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-signal/50 to-transparent" />
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <SectionEyebrow index="01">{t("eyebrow")}</SectionEyebrow>
            <StatusDot className="mt-6" color="bg-ion">
              {t("location")}
            </StatusDot>
          </div>
          <div className="lg:col-span-9">
            <RevealText
              mode="scrub"
              as="p"
              text={t("manifesto")}
              className="font-display text-[clamp(26px,3.6vw,58px)] font-normal leading-[1.12] tracking-[-0.025em] text-fg"
            />
          </div>
        </div>

        <div className="mt-[clamp(64px,9vw,140px)] grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {caps.map((cap, i) => (
              <FadeIn key={cap.title} delay={i * 0.08}>
                <SpotlightCard className="h-full p-7">
                  <div className="flex items-start justify-between text-signal">
                    {ICONS[i]}
                    <span className="mono-label text-mute">0{i + 1}</span>
                  </div>
                  <h3 className="mt-10 font-display text-[clamp(22px,2vw,30px)] font-medium tracking-[-0.02em]">{cap.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-dim">{cap.text}</p>
                  <p className="mono-label mt-6 text-mute">{cap.tech}</p>
                </SpotlightCard>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="relative md:col-span-2 lg:col-span-4" delay={0.2}>
            <div className="relative flex h-full flex-col gap-4">
              <Terminal lines={t.raw("terminal") as string[]} />
              <div className="relative flex flex-1 flex-col justify-between rounded-2xl border border-line bg-carbon/60 p-7">
                <HudCorners size={8} color="border-signal/60" />
                <p className="mono-label">{t("principlesLabel")}</p>
                <ul className="mt-6 flex flex-col divide-y divide-line">
                  {(t.raw("principles") as string[]).map((p, i) => (
                    <li key={p} className="flex items-baseline gap-4 py-3 text-[15px] text-fg">
                      <span className="font-mono text-[11px] text-signal">0{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
