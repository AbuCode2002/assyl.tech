"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useLenis, useScrollTo } from "@/components/providers/smooth-scroll";
import { ArrowIcon, MagneticButton } from "@/components/ui/magnetic-button";
import { HudCorners, TickRail } from "@/components/ui/hud";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { track } from "@/lib/tracker";
import { pad2 } from "../_shared/lead-options";
import { Odometer } from "../_shared/odometer";
import { BrowserFrame, PhoneFrame, StageBackdrop } from "./device-frame";
import type { WorkItem } from "./types";
import { pauseVideo, playExclusive } from "./video-control";

type Props = {
  items: WorkItem[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
};

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function CaseModal({ items, index, onNavigate, onClose }: Props) {
  const t = useTranslations("works");
  const total = items.length;
  const item = items[index]!;
  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const firstReveal = useRef(true);
  const titleId = useId();
  const lenis = useLenis();
  const scrollTo = useScrollTo();

  // Freeze page scroll behind the overlay.
  useEffect(() => {
    lenis?.stop();
    const html = document.documentElement;
    const previous = html.style.overflow;
    if (!lenis) html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
      lenis?.start();
    };
  }, [lenis]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  // Wipe in: signal layer, then the void content layer, with an ion scan line riding the edge.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline()
        .fromTo("[data-m-layer]", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "expo.inOut" }, 0)
        .fromTo("[data-m-content]", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, ease: "expo.inOut" }, 0.14)
        .fromTo("[data-m-line]", { yPercent: 100, opacity: 1 }, { yPercent: 0, duration: 0.85, ease: "expo.inOut" }, 0.14)
        .to("[data-m-line]", { opacity: 0, duration: 0.3 }, ">-0.1");
    },
    { scope: rootRef },
  );

  // Content reveal on open and on every prev/next switch.
  useGSAP(
    () => {
      scrollerRef.current?.scrollTo({ top: 0 });
      const first = firstReveal.current;
      firstReveal.current = false;
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline();
      if (!first) {
        tl.fromTo(
          "[data-m-swap]",
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "expo.in" },
        ).to("[data-m-swap]", { clipPath: "inset(0% 0% 100% 0%)", duration: 0.55, ease: "expo.out" });
      }
      tl.fromTo(
        "[data-m-reveal]",
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.06, ease: "expo.out" },
        first ? 0.6 : 0.45,
      );
    },
    { scope: rootRef, dependencies: [item.id], revertOnUpdate: true },
  );

  // Wipe out upwards, then unmount. Runs only from events, so no GSAP context is needed.
  function close(after?: () => void) {
    const root = rootRef.current;
    if (closing.current || !root) return;
    closing.current = true;
    const finish = () => {
      document
        .querySelector<HTMLElement>(`[data-work-button="${items[index]?.id}"]`)
        ?.focus({ preventScroll: true });
      onClose();
      after?.();
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    const q = gsap.utils.selector(root);
    gsap
      .timeline({ onComplete: finish })
      .to(q("[data-m-content]"), { clipPath: "inset(0% 0% 100% 0%)", duration: 0.75, ease: "expo.inOut" }, 0)
      .to(q("[data-m-layer]"), { clipPath: "inset(0% 0% 100% 0%)", duration: 0.75, ease: "expo.inOut" }, 0.12);
  }

  const go = (dir: 1 | -1) => {
    if (total < 2 || closing.current) return;
    onNavigate(dir === 1 ? nextIndex : prevIndex);
  };

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    const root = rootRef.current;
    if (!root) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !e.altKey && !e.metaKey) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input,textarea,select,video")) return;
      go(e.key === "ArrowRight" ? 1 : -1);
    }
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyDown(e);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const mobile = item.platform === "mobile";
  const meta = [
    { label: t("meta.category"), value: item.category },
    { label: t("meta.year"), value: item.year },
    { label: t("meta.platform"), value: t(`platforms.${item.platform}`) },
    { label: t("meta.client"), value: item.client },
  ];
  const iconButton =
    "grid size-10 place-items-center rounded-full border border-line-strong text-fg transition-[background-color,border-color,color] duration-300 hover:border-fg hover:bg-fg hover:text-void";

  return createPortal(
    <div ref={rootRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[89]">
      <div data-m-layer aria-hidden className="absolute inset-0 bg-linear-to-br from-signal to-signal-2" />

      <div data-m-content className="absolute inset-0 bg-void">
        <div ref={scrollerRef} data-lenis-prevent className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          {/* top bar */}
          <div className="sticky top-0 z-30 border-b border-line bg-void/80 backdrop-blur-xl">
            <div className="container-x flex h-16 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dim sm:gap-4">
                <span className="text-signal">{t("modal.label")}</span>
                <span className="flex items-center gap-1.5 tabular-nums text-fg">
                  <Odometer value={index + 1} max={total} />
                  <span className="text-mute">/ {pad2(total)}</span>
                </span>
                <span aria-hidden className="hidden h-3 w-px bg-line-strong sm:block" />
                <span className="hidden truncate sm:block">/works/{item.id}</span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {total > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label={t("modal.prevAria", { title: items[prevIndex]!.title })}
                      data-track-click="work-prev"
                      className={iconButton}
                    >
                      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none">
                        <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label={t("modal.nextAria", { title: items[nextIndex]!.title })}
                      data-track-click="work-next"
                      className={iconButton}
                    >
                      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none">
                        <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                      </svg>
                    </button>
                    <span aria-hidden className="mx-1 hidden h-6 w-px bg-line sm:block" />
                  </>
                )}
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => close()}
                  aria-label={t("modal.closeAria")}
                  data-track-click="work-close"
                  className="group/close flex h-10 items-center gap-3 rounded-full border border-line-strong pl-1.5 pr-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-fg transition-colors duration-300 hover:border-fg/50 sm:pl-4"
                >
                  <span className="hidden sm:inline">{t("modal.close")}</span>
                  <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[9px] text-dim sm:inline">ESC</kbd>
                  <span className="grid size-7 place-items-center rounded-full bg-fg text-void transition-transform duration-500 ease-out-expo group-hover/close:rotate-90">
                    <svg aria-hidden viewBox="0 0 12 12" className="size-3" fill="none">
                      <path d="m2.5 2.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <article key={item.id} className="container-x pb-[clamp(64px,10vw,140px)]">
            {/* header */}
            <header className="grid gap-8 pt-[clamp(40px,7vw,104px)] lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <div data-m-reveal className="mono-label flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="tabular-nums text-signal">{pad2(index + 1)}</span>
                  <span aria-hidden className="h-px w-8 bg-line-strong" />
                  <span>{item.category}</span>
                  <span aria-hidden className="text-mute">
                    /
                  </span>
                  <span>{item.year}</span>
                </div>
                <h2
                  id={titleId}
                  data-m-reveal
                  className="mt-6 font-display text-[clamp(40px,7.2vw,124px)] font-medium leading-[0.92] tracking-[-0.045em]"
                >
                  {item.title}
                </h2>
              </div>
              <p data-m-reveal className="max-w-[46ch] text-[clamp(16px,1.3vw,19px)] leading-relaxed text-dim lg:col-span-4">
                {item.summary}
              </p>
            </header>

            <div className="mt-[clamp(40px,6vw,88px)] grid gap-12 lg:grid-cols-12 lg:gap-10">
              {/* media */}
              <div className="lg:order-2 lg:col-span-7">
                <div data-m-reveal className="lg:sticky lg:top-24">
                  <div
                    style={{ "--accent": item.accent } as CSSProperties}
                    className={cn(
                      "relative isolate overflow-hidden rounded-2xl border border-line bg-carbon",
                      mobile ? "aspect-[4/5] max-h-[calc(100svh-140px)] w-full" : "aspect-[4/3.2] sm:aspect-[16/11]",
                    )}
                  >
                    <StageBackdrop />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ModalVideo key={item.id} item={item} mobile={mobile} />
                    </div>
                    <HudCorners className="inset-4" size={14} color="border-fg/40" />
                    <div className="pointer-events-none absolute inset-x-8 top-7 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                      <span>{item.title}</span>
                      <span className="tabular-nums">{item.year}</span>
                    </div>
                    <TickRail count={48} className="pointer-events-none absolute inset-x-8 bottom-6 hidden sm:flex" />
                  </div>
                </div>
              </div>

              {/* details */}
              <div className="flex flex-col gap-12 lg:order-1 lg:col-span-5">
                <dl data-m-reveal className="grid grid-cols-2 border-t border-line">
                  {meta.map((m, i) => (
                    <div key={m.label} className={cn("border-b border-line py-4", i % 2 === 1 && "border-l pl-5")}>
                      <dt className="mono-label">{m.label}</dt>
                      <dd className="mt-2 text-[15px] text-fg">{m.value}</dd>
                    </div>
                  ))}
                </dl>

                <section data-m-reveal aria-label={t("modal.features")}>
                  <h3 className="mono-label">{t("modal.features")}</h3>
                  <ol className="mt-4 border-t border-line">
                    {item.features.map((f, i) => (
                      <li key={f} className="group/f relative flex gap-5 overflow-hidden border-b border-line py-5">
                        <span
                          aria-hidden
                          className="absolute inset-0 origin-left scale-x-0 bg-linear-to-r from-signal/12 to-transparent transition-transform duration-700 ease-out-expo group-hover/f:scale-x-100"
                        />
                        <span className="relative pt-1 font-mono text-[11px] tabular-nums text-signal">{pad2(i + 1)}</span>
                        <span className="relative text-[clamp(16px,1.25vw,19px)] leading-snug text-fg transition-transform duration-700 ease-out-expo group-hover/f:translate-x-2">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section data-m-reveal aria-label={t("meta.stack")}>
                  <h3 className="mono-label">{t("meta.stack")}</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {item.stack.map((s) => (
                      <li key={s} className="rounded-full border border-line-strong px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/85">
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            {item.stills.length > 0 && (
              <section className="mt-[clamp(56px,8vw,120px)]" aria-label={t("modal.stills")}>
                <h3 data-m-reveal className="mono-label">
                  {t("modal.stills")}
                </h3>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {item.stills.map((src, i) => (
                    <figure data-m-reveal key={src} className="relative overflow-hidden rounded-2xl border border-line bg-carbon">
                      <Image
                        src={src}
                        alt={t("modal.still", { title: item.title, index: i + 1 })}
                        width={1280}
                        height={672}
                        sizes="(min-width: 768px) 46vw, 92vw"
                        className="h-auto w-full"
                      />
                      <HudCorners className="inset-3" size={10} />
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <section
              data-m-reveal
              className="relative mt-[clamp(56px,8vw,120px)] grid gap-8 overflow-hidden rounded-2xl border border-line bg-carbon p-7 sm:p-10 md:grid-cols-12 md:items-end md:p-12"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-32 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(59_123_255/0.28),transparent)]"
              />
              <div className="relative md:col-span-7 lg:col-span-8">
                <h3 className="font-display text-[clamp(26px,3vw,48px)] font-medium leading-[1] tracking-[-0.03em]">
                  {t("modal.ctaTitle")}
                </h3>
                <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-dim">{t("modal.ctaText")}</p>
              </div>
              <div className="relative md:col-span-5 md:justify-self-end lg:col-span-4">
                <MagneticButton
                  size="lg"
                  className="whitespace-nowrap"
                  icon={<ArrowIcon />}
                  data-track-click={`work-cta-${item.id}`}
                  onClick={() =>
                    close(() => {
                      lenis?.start();
                      scrollTo("#contact");
                    })
                  }
                >
                  {t("modal.cta")}
                </MagneticButton>
              </div>
            </section>

            {/* next project */}
            {total > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                data-track-click="work-next-title"
                aria-label={t("modal.nextAria", { title: items[nextIndex]!.title })}
                className="group/next mt-[clamp(56px,8vw,120px)] block w-full border-t border-line pt-8 text-left"
              >
                <span className="mono-label flex items-center gap-3">
                  <span className="text-signal">{pad2(nextIndex + 1)}</span>
                  <span aria-hidden className="h-px w-8 bg-line-strong" />
                  {t("modal.nextProject")}
                </span>
                <span className="mt-5 flex items-center justify-between gap-6">
                  <span className="text-outline font-display text-[clamp(34px,6.4vw,112px)] font-medium leading-[0.95] tracking-[-0.045em] transition-[color] duration-500 group-hover/next:text-fg">
                    {items[nextIndex]!.title}
                  </span>
                  <span className="grid size-14 shrink-0 place-items-center rounded-full border border-line-strong transition-[rotate,background-color,border-color] duration-500 ease-out-expo group-hover/next:rotate-45 group-hover/next:border-signal group-hover/next:bg-signal">
                    <ArrowIcon className="size-4" />
                  </span>
                </span>
              </button>
            )}
          </article>
        </div>

        <div data-m-swap aria-hidden className="pointer-events-none absolute inset-0 z-40 bg-signal [clip-path:inset(100%_0_0_0)]" />
      </div>

      <div data-m-line aria-hidden className="pointer-events-none absolute inset-0 opacity-0">
        <span className="absolute inset-x-0 top-0 h-px bg-ion shadow-[0_0_24px_3px_rgb(86_225_255/0.65)]" />
      </div>
    </div>,
    document.body,
  );
}

function ModalVideo({ item, mobile }: { item: WorkItem; mobile: boolean }) {
  const t = useTranslations("works");
  const ref = useRef<HTMLVideoElement>(null);
  const tracked = useRef(false);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!prefersReducedMotion()) playExclusive(video);
    return () => pauseVideo(video);
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) playExclusive(video);
    else pauseVideo(video);
  };

  const video = (
    <video
      ref={ref}
      className="absolute inset-0 size-full object-cover"
      poster={item.poster}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden
      tabIndex={-1}
      onPlay={() => setPaused(false)}
      onPlaying={() => {
        if (tracked.current) return;
        tracked.current = true;
        track("video", "play", { id: item.id, from: "modal" });
      }}
      onPause={() => setPaused(true)}
    >
      <source src={item.video} type="video/mp4" />
    </video>
  );

  return (
    <>
      {mobile ? (
        <PhoneFrame className="h-[84%]">{video}</PhoneFrame>
      ) : (
        <BrowserFrame url={item.url} className="w-[90%]">
          {video}
        </BrowserFrame>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={paused ? t("modal.play") : t("modal.pause")}
        className="absolute bottom-10 right-8 z-10 grid size-11 place-items-center rounded-full border border-line-strong bg-void/70 text-fg backdrop-blur-md transition-colors duration-300 hover:border-fg hover:bg-fg hover:text-void sm:bottom-12"
      >
        {paused ? (
          <svg aria-hidden viewBox="0 0 12 12" className="size-3" fill="currentColor">
            <path d="M3 1.8v8.4L10 6z" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 12 12" className="size-3" fill="currentColor">
            <path d="M2.5 2h2.5v8H2.5zM7 2h2.5v8H7z" />
          </svg>
        )}
      </button>
    </>
  );
}
