"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowIcon } from "@/components/ui/magnetic-button";
import { HudCorners } from "@/components/ui/hud";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { track } from "@/lib/tracker";
import { pad2 } from "../_shared/lead-options";
import { ScrambleOverlay } from "../_shared/scramble-overlay";
import { BrowserFrame, PhoneFrame, StageBackdrop } from "./device-frame";
import type { WorkItem } from "./types";
import { pauseVideo, playExclusive } from "./video-control";

type Props = {
  item: WorkItem;
  index: number;
  total: number;
  speed: number;
  className?: string;
  onOpen: (index: number) => void;
};

export function WorkCard({ item, index, total, speed, className, onOpen }: Props) {
  const t = useTranslations("works");
  const cardRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pillTo = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null);
  const tracked = useRef(false);
  const [scramble, setScramble] = useState(0);
  const [playing, setPlaying] = useState(false);

  useGSAP(
    () => {
      if (!pillRef.current) return;
      pillTo.current = {
        x: gsap.quickTo(pillRef.current, "x", { duration: 0.6, ease: "power3" }),
        y: gsap.quickTo(pillRef.current, "y", { duration: 0.6, ease: "power3" }),
      };
    },
    { scope: cardRef },
  );

  // Touch devices: preview plays while the stage is mostly in view. Desktop: on hover.
  useEffect(() => {
    const video = videoRef.current;
    const stage = stageRef.current;
    if (!video || !stage) return;

    const onPlaying = () => {
      setPlaying(true);
      if (!tracked.current) {
        tracked.current = true;
        track("video", "play", { id: item.id, from: "card" });
      }
    };
    const onPause = () => setPlaying(false);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);

    let io: IntersectionObserver | undefined;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!prefersReducedMotion()) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting && !finePointer) playExclusive(video);
          else if (!entry.isIntersecting) pauseVideo(video);
        },
        { threshold: finePointer ? 0 : 0.6 },
      );
      io.observe(stage);
    }

    return () => {
      io?.disconnect();
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      pauseVideo(video);
    };
  }, [item.id]);

  const placePill = (e: PointerEvent, immediate = false) => {
    const card = cardRef.current;
    const pill = pillRef.current;
    if (!card || !pill) return;
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (immediate || !pillTo.current) gsap.set(pill, { x, y });
    else {
      pillTo.current.x(x);
      pillTo.current.y(y);
    }
  };

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    placePill(e, true);
    setScramble((n) => n + 1);
    if (videoRef.current && !prefersReducedMotion()) playExclusive(videoRef.current);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse") placePill(e);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (videoRef.current) pauseVideo(videoRef.current);
  };

  const mobile = item.platform === "mobile";
  const video = (
    <video
      ref={videoRef}
      className="absolute inset-0 size-full object-cover"
      poster={item.poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-hidden
      tabIndex={-1}
    >
      <source src={item.video} type="video/mp4" />
    </video>
  );

  return (
    <li data-work-card data-speed={speed} className={cn("relative w-full list-none", className)}>
      <article
        ref={cardRef}
        data-parallax
        data-track-click={`work-open-${item.id}`}
        onClick={() => onOpen(index)}
        className="group/work relative cursor-pointer rounded-2xl outline-offset-8 has-[button:focus-visible]:outline has-[button:focus-visible]:outline-1 has-[button:focus-visible]:outline-ion"
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {/* media stage */}
        <div
          ref={stageRef}
          data-stage
          style={{ "--accent": item.accent } as CSSProperties}
          className={cn(
            "relative isolate overflow-hidden rounded-2xl border border-line bg-carbon transition-colors duration-700 group-hover/work:border-line-strong",
            mobile ? "aspect-[4/5]" : "aspect-[4/3.4] sm:aspect-[16/11]",
          )}
        >
          <StageBackdrop />
          <div
            data-media
            className="absolute inset-0 flex items-center justify-center transition-transform duration-[1400ms] ease-out-expo will-change-transform group-hover/work:scale-[1.035]"
          >
            {mobile ? (
              <PhoneFrame className="h-[80%]">{video}</PhoneFrame>
            ) : (
              <BrowserFrame url={item.url} className="w-[86%] sm:w-[80%]">
                {video}
              </BrowserFrame>
            )}
          </div>

          {/* scanning hairline */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-y-full bg-linear-to-b from-transparent via-transparent to-ion/[0.06] opacity-0 transition-[translate,opacity] duration-[1300ms] ease-out-expo group-hover/work:translate-y-0 group-hover/work:opacity-100"
          >
            <span className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-ion/80 to-transparent" />
          </span>

          <HudCorners className="inset-3 sm:inset-4" size={12} color="border-fg/35" />

          <div className="pointer-events-none absolute inset-x-6 top-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-dim sm:inset-x-8 sm:top-7">
            <span className="tabular-nums">
              <span className="text-fg">{pad2(index + 1)}</span> / {pad2(total)}
            </span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "size-1.5 rounded-full transition-[background-color,box-shadow] duration-300",
                  playing ? "bg-ion shadow-[0_0_10px_rgb(86_225_255/0.9)]" : "bg-mute",
                )}
              />
              {playing ? t("live") : t("preview")}
            </span>
          </div>
          <div className="pointer-events-none absolute inset-x-6 bottom-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-mute sm:inset-x-8 sm:bottom-7">
            <span className="truncate">/works/{item.id}</span>
            <span className="shrink-0">{t(`platforms.${item.platform}`)}</span>
          </div>
        </div>

        {/* meta */}
        <div className="mt-5 flex flex-col gap-4 sm:mt-7">
          <div data-reveal className="mono-label flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="tabular-nums text-signal">{pad2(index + 1)}</span>
            <span aria-hidden className="h-px w-6 bg-line-strong" />
            <span>{item.category}</span>
            <span aria-hidden className="text-mute">
              /
            </span>
            <span className="tabular-nums">{item.year}</span>
          </div>

          <div className="flex items-end justify-between gap-6">
            <h3
              data-reveal
              className="min-w-0 font-display text-[clamp(28px,3.3vw,54px)] font-medium leading-[1] tracking-[-0.035em]"
            >
              <button
                type="button"
                data-work-button={item.id}
                onFocus={() => setScramble((n) => n + 1)}
                aria-haspopup="dialog"
                aria-label={t("openCase", { title: item.title })}
                className="text-left outline-none"
              >
                <ScrambleOverlay text={item.title} play={scramble} />
              </button>
            </h3>
            <span
              data-reveal
              aria-hidden
              className="mb-1 hidden size-12 shrink-0 place-items-center rounded-full border border-line-strong transition-[rotate,background-color,border-color] duration-500 ease-out-expo group-hover/work:rotate-45 group-hover/work:border-signal group-hover/work:bg-signal sm:grid"
            >
              <ArrowIcon />
            </span>
          </div>

          <div aria-hidden className="relative h-px w-full overflow-hidden bg-line">
            <span className="absolute inset-0 origin-left scale-x-0 bg-linear-to-r from-signal via-ion to-transparent transition-transform duration-[1100ms] ease-out-expo group-hover/work:scale-x-100" />
          </div>

          <ul data-reveal className="flex flex-wrap gap-2" aria-label={t("meta.stack")}>
            {item.stack.map((s) => (
              <li
                key={s}
                className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dim transition-colors duration-500 group-hover/work:border-line-strong group-hover/work:text-fg/80"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* cursor-follow label */}
        <span ref={pillRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block">
          <span className="flex -translate-x-1/2 -translate-y-1/2 scale-50 items-center gap-2 whitespace-nowrap rounded-full bg-fg px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-void opacity-0 shadow-[0_10px_40px_-10px_rgb(86_225_255/0.6)] transition-[opacity,scale] duration-500 ease-out-expo group-hover/work:scale-100 group-hover/work:opacity-100">
            {t("viewCase")}
            <ArrowIcon className="size-3" />
          </span>
        </span>
      </article>
    </li>
  );
}
