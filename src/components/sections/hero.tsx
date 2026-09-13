"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useScrollTo } from "@/components/providers/smooth-scroll";
import type { HeroSceneState } from "@/components/three/particle-logo";
import { StatusDot, TickRail } from "@/components/ui/hud";
import { LogoMark } from "@/components/ui/logo";
import { ArrowIcon, MagneticButton } from "@/components/ui/magnetic-button";
import { ScrambleText } from "@/components/ui/scramble-text";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { site } from "@/lib/site";

const ParticleLogoCanvas = dynamic(() => import("@/components/three/particle-logo"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Hero() {
  const t = useTranslations("hero");
  const root = useRef<HTMLElement>(null);
  const scene = useRef<HeroSceneState>({ morph: 0, scatter: 0 });
  const [active, setActive] = useState(true);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const scrollTo = useScrollTo();
  const lines = t.raw("title") as string[];
  const tags = t.raw("tags") as string[];
  const longest = Math.max(...lines.map((l) => l.length));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability probe must run on the client
    setWebgl(hasWebGL());
    const io = new IntersectionObserver(([e]) => setActive(!!e?.isIntersecting), { rootMargin: "100px" });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => onIntroDone(() => setIntroDone(true)), []);

  // intro + scroll choreography
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (prefersReducedMotion()) {
        scene.current.morph = 1;
        return;
      }
      gsap.set(q("[data-line]"), { yPercent: 110 });
      gsap.set(q("[data-fade]"), { opacity: 0, y: 24 });
      gsap.set(q("[data-hud]"), { opacity: 0 });

      const st = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      st.to(scene.current, { scatter: 1, ease: "power2.in" }, 0)
        .to(q("[data-content]"), { yPercent: -18, opacity: 0, ease: "power1.in" }, 0)
        .to(q("[data-hud-layer]"), { opacity: 0, ease: "power1.in" }, 0);
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!introDone || prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      scene.current.morph = 1;
      const tl = gsap.timeline({ delay: 0.15 });
      tl.to(q("[data-line]"), { yPercent: 0, duration: 1.5, stagger: 0.09, ease: "expo.out" })
        .to(q("[data-fade]"), { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: "expo.out" }, 0.45)
        .to(q("[data-hud]"), { opacity: 1, duration: 1, stagger: 0.05 }, 0.6);
    },
    { scope: root, dependencies: [introDone] },
  );

  return (
    <section
      ref={root}
      id="hero"
      data-track-section="hero"
      className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-void"
    >
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* soft glows as gradients — a CSS blur() of this size is expensive to rasterise */}
        <div className="absolute inset-0 [background:radial-gradient(ellipse_45%_55%_at_78%_40%,rgb(59_123_255/0.2),transparent_70%),radial-gradient(ellipse_50%_35%_at_30%_105%,rgb(90_92_255/0.12),transparent_70%)] max-md:[background:radial-gradient(ellipse_80%_45%_at_50%_25%,rgb(59_123_255/0.22),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(255 255 255 / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.045) 1px, transparent 1px)",
            backgroundSize: "calc(100% / 12) 120px",
            maskImage: "radial-gradient(ellipse 80% 70% at 60% 45%, #000 20%, transparent 75%)",
          }}
        />
      </div>

      {/* WebGL particle logo */}
      <div aria-hidden className="absolute inset-0">
        {webgl && <ParticleLogoCanvas state={scene} active={active} />}
        {webgl === false && (
          <div className="absolute inset-0 flex items-start justify-center pt-[18vh] md:items-center md:justify-end md:pr-[8vw] md:pt-0">
            <LogoMark className="w-[70vw] max-w-[640px] text-fg drop-shadow-[0_0_60px_rgba(59,123,255,0.45)] md:w-[46vw]" />
          </div>
        )}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-void via-void/70 to-transparent" />

      {/* HUD */}
      <div data-hud-layer aria-hidden className="pointer-events-none absolute inset-0">
        <div className="container-x relative h-full">
          <div data-hud className="absolute left-[clamp(20px,4vw,56px)] top-28 hidden items-center gap-4 md:flex">
            <span className="mono-label text-fg/70">[00]</span>
            <span className="h-px w-8 bg-line-strong" />
            <ScrambleText text={t("eyebrow")} className="mono-label" trigger={introDone ? "mount" : "none"} />
          </div>
          <div data-hud className="absolute right-[clamp(20px,4vw,56px)] top-28 hidden flex-col items-end gap-2 md:flex">
            <StatusDot>{t("status")}</StatusDot>
            <span className="mono-label text-mute">{site.coords}</span>
          </div>
          <TickRail vertical count={32} className="absolute left-3 top-1/2 hidden h-[46vh] -translate-y-1/2 lg:flex" />
          <TickRail vertical count={32} className="absolute right-3 top-1/2 hidden h-[46vh] -translate-y-1/2 items-end lg:flex" />
          <span data-hud className="absolute left-[18%] top-[30%] hidden font-mono text-xs text-fg/25 lg:block">+</span>
          <span data-hud className="absolute right-[12%] top-[62%] hidden font-mono text-xs text-fg/25 lg:block">+</span>
          <span data-hud className="absolute left-[46%] top-[18%] hidden font-mono text-xs text-fg/25 lg:block">+</span>
        </div>
      </div>

      {/* content */}
      <div data-content className="container-x relative flex h-full flex-col justify-end pb-[clamp(28px,6vh,72px)]">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p data-fade className="mono-label mb-6 flex items-center gap-3 md:hidden">
              <span className="text-signal">[00]</span> {t("eyebrow")}
            </p>
            <h1
              className="font-display font-medium leading-[0.92] tracking-[-0.035em]"
              // Unbounded is wide: cap the size so the longest line (e.g. Kazakh) always fits the viewport
              style={{ fontSize: `min(124px, calc((100vw - 48px) / ${longest * 0.8}), max(40px, 7.4vw))` }}
            >
              {lines.map((line, i) => (
                <span key={i} className="block overflow-hidden pb-[0.06em]">
                  <span data-line className={i === lines.length - 1 ? "block text-signal-gradient" : "block text-chrome"}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p data-fade className="mt-7 max-w-[34rem] text-[clamp(15px,1.25vw,19px)] leading-relaxed text-dim">
              {t("subtitle")}
            </p>
            <div data-fade className="mt-9 flex flex-wrap items-center gap-3">
              <MagneticButton
                size="lg"
                icon={<ArrowIcon />}
                data-track-click="cta-hero"
                onClick={() => scrollTo("#contact")}
              >
                {t("ctaPrimary")}
              </MagneticButton>
              <MagneticButton size="lg" variant="ghost" data-track-click="cta-hero-works" onClick={() => scrollTo("#works")}>
                {t("ctaSecondary")}
              </MagneticButton>
            </div>
          </div>

          <div className="hidden flex-col items-end gap-8 lg:col-span-4 lg:flex">
            <ul data-fade className="flex flex-col items-end gap-2">
              {tags.map((tag, i) => (
                <li key={tag} className="mono-label flex items-center gap-3">
                  <ScrambleText text={tag} trigger="hover" className="text-fg/80" />
                  <span className="text-mute">0{i + 1}</span>
                </li>
              ))}
            </ul>
            <button
              data-fade
              type="button"
              onClick={() => scrollTo("#about")}
              className="group mono-label flex items-center gap-4 text-fg/70 transition-colors hover:text-fg"
            >
              {t("scroll")}
              <span className="relative block h-12 w-px overflow-hidden bg-line-strong">
                <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_1.8s_var(--ease-in-out-expo)_infinite] bg-fg" />
              </span>
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(200%)}}`}</style>
    </section>
  );
}
