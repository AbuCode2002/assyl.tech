"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/smooth-scroll";
import { LOGO_PATHS, BRACKET_STROKE } from "@/components/ui/logo-paths";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { markIntroDone } from "@/lib/intro";

const SEEN_KEY = "assyl_preloaded";

export function Preloader() {
  const t = useTranslations("nav.preloader");
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);
  const lenis = useLenis();
  const lines = t.raw("lines") as string[];

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      let seen = false;
      try {
        seen = sessionStorage.getItem(SEEN_KEY) === "1";
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}

      if (prefersReducedMotion()) {
        markIntroDone();
        setGone(true);
        return;
      }

      document.documentElement.style.overflow = "hidden";
      window.scrollTo(0, 0);
      const fast = seen;
      const progress = { v: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          document.documentElement.style.overflow = "";
          setGone(true);
        },
      });

      tl.set(q("[data-draw]"), { strokeDasharray: 1, strokeDashoffset: 1 })
        .set(q("[data-fill]"), { opacity: 0 })
        .set(q("[data-log]"), { opacity: 0, x: -8 });

      if (!fast) {
        tl.to(q("[data-draw]"), { strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: "power2.inOut" }, 0)
          .to(q("[data-log]"), { opacity: 1, x: 0, duration: 0.4, stagger: 0.32, ease: "power2.out" }, 0.1)
          .to(q("[data-fill]"), { opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }, 1.2);
      } else {
        tl.to(q("[data-draw]"), { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, 0).to(
          q("[data-fill]"),
          { opacity: 1, duration: 0.3 },
          0.3,
        );
      }

      tl.to(
        progress,
        {
          v: 100,
          duration: fast ? 0.7 : 2,
          ease: "power3.inOut",
          onUpdate: () => {
            const v = Math.round(progress.v);
            if (counter.current) counter.current.textContent = String(v).padStart(3, "0");
            root.current?.style.setProperty("--p", String(progress.v / 100));
          },
        },
        0,
      );

      tl.addLabel("exit")
        .to(q("[data-content]"), { opacity: 0, y: -20, duration: 0.45, ease: "power2.in" }, "exit")
        .add(() => markIntroDone(), "exit+=0.25")
        .to(q("[data-panel-top]"), { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "exit+=0.2")
        .to(q("[data-panel-bottom]"), { yPercent: 100, duration: 1.1, ease: "expo.inOut" }, "exit+=0.2")
        .to(q("[data-seam]"), { scaleX: 0, duration: 0.8, ease: "expo.inOut" }, "exit+=0.1");
    },
    { scope: root },
  );

  // keep Lenis paused while the loader covers the page
  useEffect(() => {
    if (!lenis) return;
    if (gone) lenis.start();
    else lenis.stop();
  }, [lenis, gone]);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100]" style={{ ["--p" as string]: 0 }} aria-hidden>
      <div data-panel-top className="absolute inset-x-0 top-0 h-1/2 bg-void" />
      <div data-panel-bottom className="absolute inset-x-0 bottom-0 h-1/2 bg-void" />
      <div
        data-seam
        className="absolute inset-x-0 top-1/2 h-px origin-center bg-gradient-to-r from-transparent via-signal to-transparent"
      />

      <div data-content className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 w-[min(46vw,300px)] -translate-x-1/2 -translate-y-[60%]">
          <svg viewBox="0 0 620 420" className="w-full overflow-visible">
            <defs>
              <linearGradient id="pl-sw" x1="0" y1="400" x2="430" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#5a5cff" />
                <stop offset="1" stopColor="#3b82ff" />
              </linearGradient>
            </defs>
            {[LOGO_PATHS.leftLeg, LOGO_PATHS.rightLeg].map((d) => (
              <g key={d}>
                <path data-fill d={d} fill="#eef2f8" />
                <path data-draw d={d} pathLength={1} fill="none" stroke="#eef2f8" strokeWidth={2} />
              </g>
            ))}
            <path data-fill d={LOGO_PATHS.swoosh} fill="url(#pl-sw)" />
            <path data-draw d={LOGO_PATHS.swoosh} pathLength={1} fill="none" stroke="#3b7bff" strokeWidth={2} />
            <path
              data-draw
              d={LOGO_PATHS.brackets}
              pathLength={1}
              fill="none"
              stroke="#4c6ef5"
              strokeWidth={BRACKET_STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="container-x absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 pb-8">
          <ul className="flex flex-col gap-1.5 font-mono text-[11px] text-dim">
            {lines.map((line, i) => (
              <li key={i} data-log className="flex gap-2">
                <span className="text-signal">&gt;</span>
                <span>{line}</span>
                <span className="text-ok">{i === lines.length - 1 ? "✓" : "ok"}</span>
              </li>
            ))}
          </ul>
          <div className="text-right">
            <div className="mono-label mb-1">assyl.tech // boot</div>
            <span ref={counter} className="font-display text-[clamp(48px,9vw,120px)] font-medium leading-none tabular-nums text-fg">
              000
            </span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-line">
          <div className="h-full origin-left bg-signal" style={{ transform: "scaleX(var(--p))" }} />
        </div>
      </div>
    </div>
  );
}
