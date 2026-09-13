"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useScrollTo } from "@/components/providers/smooth-scroll";
import { HudCorners, SectionEyebrow, StatusDot, TickRail } from "@/components/ui/hud";
import { ArrowIcon } from "@/components/ui/magnetic-button";
import { ScrambleText } from "@/components/ui/scramble-text";
import { projects } from "@/content/projects";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

const ShowcaseScene = dynamic(() => import("@/components/three/showcase-scene"), { ssr: false });

const ORDER = ["storeplan", "krovla", "farabi-dashboard", "farabi-assistant"] as const;
const START = [0, 0.36, 0.62, 0.88];
const chapterAt = (p: number) => (p >= START[3]! ? 3 : p >= START[2]! ? 2 : p >= START[1]! ? 1 : 0);

export function Showcase() {
  const t = useTranslations("showcase");
  const locale = useLocale() as Locale;
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [chapter, setChapter] = useState(0);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const scrollTo = useScrollTo();

  const items = ORDER.map((id) => projects.find((p) => p.id === id)!);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- capability probe must run on the client
      setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
    const el = root.current!;
    const nearIo = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), { rootMargin: "150% 0px" });
    const viewIo = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), { rootMargin: "10% 0px" });
    nearIo.observe(el);
    viewIo.observe(el);
    return () => {
      nearIo.disconnect();
      viewIo.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progress.current = self.progress;
          bar.current?.style.setProperty("--sp", String(self.progress));
          setChapter((c) => {
            const next = chapterAt(self.progress);
            return next === c ? c : next;
          });
        },
      });
    },
    { scope: root },
  );

  const current = items[chapter]!;
  const deviceKey = current.platform === "mobile" ? "phone" : "laptop";

  /** jump to the middle of a chapter */
  const goTo = (i: number) => {
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    const mid = (START[i]! + (START[i + 1] ?? 1)) / 2;
    scrollTo(top + total * (i === 0 ? 0.2 : mid));
  };

  return (
    <section
      ref={root}
      id="showcase"
      data-track-section="showcase"
      className="relative h-[460vh] border-t border-line bg-void md:h-[560vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* glow backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-[60%] top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] transition-colors duration-1000 max-md:left-1/2 max-md:top-[38%]"
            style={{ backgroundColor: `${current.accent}2e` }}
          />
        </div>

        {/* 3D */}
        <div aria-hidden className="absolute inset-0">
          {webgl && near && <ShowcaseScene progress={progress} active={inView} />}
          {!webgl && (
            <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[10vw]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.poster}
                alt=""
                className={cn(
                  "rounded-[28px] border border-line-strong object-cover shadow-2xl",
                  current.platform === "mobile" ? "h-[60vh] w-auto" : "w-[min(80vw,760px)]",
                )}
              />
            </div>
          )}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-void via-void/80 to-transparent md:hidden" />

        {/* overlay */}
        <div className="container-x pointer-events-none relative flex h-full flex-col justify-between pb-8 pt-24 md:pb-12 md:pt-28">
          <div className="flex items-start justify-between gap-6">
            <div>
              <SectionEyebrow index="02">{t("eyebrow")}</SectionEyebrow>
              <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(22px,2.6vw,40px)] font-medium leading-[1.05] tracking-[-0.03em] text-fg max-md:hidden">
                {t("title")}
              </h2>
            </div>
            <div className="hidden flex-col items-end gap-2 md:flex">
              <StatusDot>{t("live")}</StatusDot>
              <span className="mono-label text-mute">{t("hint")}</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-8">
            {/* chapter copy */}
            <div className="pointer-events-auto relative w-full max-w-[440px]">
              <div className="mono-label mb-4 flex items-center gap-3">
                <span className="tabular-nums text-signal">
                  {String(chapter + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </span>
                <span className="h-px w-8 bg-line-strong" />
                <span>{current.category[locale]}</span>
              </div>
              <div className="relative min-h-[178px] md:min-h-[260px]">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    aria-hidden={i !== chapter}
                    className={cn(
                      "absolute inset-x-0 bottom-0 transition-[opacity,transform,filter] duration-700 ease-out-expo",
                      i === chapter ? "translate-y-0 opacity-100 blur-0" : i < chapter ? "-translate-y-6 opacity-0 blur-sm" : "translate-y-6 opacity-0 blur-sm",
                    )}
                  >
                    <h3 className="font-display text-[clamp(34px,4.4vw,68px)] font-medium leading-[0.95] tracking-[-0.035em]">
                      {i === chapter ? <ScrambleText text={item.title} trigger="mount" duration={700} /> : item.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-dim max-md:line-clamp-3 md:text-[16px]">{item.summary[locale]}</p>
                    <div className="mt-5 flex flex-wrap gap-2 max-md:hidden">
                      {item.stack.map((s) => (
                        <span key={s} className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                tabIndex={0}
                data-track-click={`showcase-case-${current.id}`}
                onClick={() => scrollTo("#works")}
                className="group mono-label mt-6 inline-flex items-center gap-3 text-fg"
              >
                <span className="relative">
                  {t("cta")}
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-signal transition-transform duration-500 ease-out-expo group-hover:scale-x-100" />
                </span>
                <ArrowIcon className="transition-transform duration-500 ease-out-expo group-hover:rotate-45" />
              </button>
            </div>

            {/* telemetry */}
            <div className="relative hidden w-[250px] shrink-0 p-5 lg:block">
              <HudCorners size={9} />
              <dl className="flex flex-col gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">{t("hud.device")}</dt>
                  <dd className="text-fg">{t(`hud.${deviceKey}`)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">{t("hud.client")}</dt>
                  <dd className="text-fg">{current.client[locale]}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">{t("hud.year")}</dt>
                  <dd className="text-fg">{current.year}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">{t("hud.stream")}</dt>
                  <dd className="flex items-center gap-2 text-ok">
                    <span className="size-1.5 animate-pulse rounded-full bg-ok" /> REC
                  </dd>
                </div>
              </dl>
              <div className="mt-5 h-px w-full bg-line">
                <div ref={bar} className="h-full origin-left bg-signal" style={{ transform: "scaleX(var(--sp, 0))" }} />
              </div>
            </div>
          </div>
        </div>

        {/* chapter rail */}
        <nav aria-label={t("eyebrow")} className="absolute right-[clamp(12px,2vw,28px)] top-1/2 z-10 flex -translate-y-1/2 flex-col items-end gap-5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === chapter}
              aria-label={item.title}
              className="group flex items-center gap-3"
            >
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.14em] transition-all duration-500 max-md:hidden",
                  i === chapter ? "text-fg opacity-100" : "translate-x-2 text-mute opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                )}
              >
                {item.title}
              </span>
              <span
                className={cn(
                  "block h-px transition-all duration-500 ease-out-expo",
                  i === chapter ? "w-10 bg-signal" : "w-4 bg-fg/30 group-hover:w-6 group-hover:bg-fg/60",
                )}
              />
            </button>
          ))}
          <TickRail vertical count={14} className="mt-2 hidden h-24 items-end md:flex" />
        </nav>
      </div>
    </section>
  );
}
