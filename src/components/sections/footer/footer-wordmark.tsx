"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";

/*
 * Mask centre = blend of an idle Lissajous drift (--dx/--dy) and the pointer (--px/--py),
 * weighted by --h (0 idle → 1 hovering), so entering/leaving never jumps.
 */
const X = "calc((var(--dx,0) * (1 - var(--h,0)) + var(--px,0) * var(--h,0)) * 1px)";
const Y = "calc((var(--dy,0) * (1 - var(--h,0)) + var(--py,0) * var(--h,0)) * 1px)";
const MASK = `radial-gradient(circle calc(var(--r,0) * 1px) at ${X} ${Y}, #000 0%, rgb(0 0 0 / 0.85) 38%, transparent 100%)`;

const typeClass = "block w-max whitespace-nowrap font-display font-semibold leading-[0.8] tracking-[-0.045em]";

/** Edge-to-edge outlined wordmark; a cursor-following radial mask reveals the gradient fill below. */
export function FooterWordmark({ text }: { text: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | null>(null);
  const hover = useRef<{ px: gsap.QuickToFunc; py: gsap.QuickToFunc } | null>(null);

  // Fit the word to the container width exactly (font metrics are only known once the font loads).
  useEffect(() => {
    const box = boxRef.current;
    const measure = measureRef.current;
    if (!box || !measure) return;
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const width = measure.getBoundingClientRect().width;
        if (!width) return;
        const current = parseFloat(getComputedStyle(measure).fontSize);
        const next = (current * box.clientWidth) / width;
        setSize((prev) => (prev !== null && Math.abs(prev - next) < 0.5 ? prev : next));
      });
    };
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  useGSAP(
    () => {
      const box = boxRef.current;
      if (!box) return;
      const w = () => box.clientWidth;
      const h = () => box.clientHeight;
      gsap.set(box, { "--dx": w() * 0.5, "--dy": h() * 0.5, "--px": w() * 0.5, "--py": h() * 0.5, "--h": 0, "--r": w() * 0.16 });
      if (prefersReducedMotion()) return;

      const driftX = gsap.fromTo(
        box,
        { "--dx": () => w() * 0.08 },
        { "--dx": () => w() * 0.92, duration: 6.5, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true },
      );
      const driftY = gsap.fromTo(
        box,
        { "--dy": () => h() * 0.15 },
        { "--dy": () => h() * 0.85, duration: 2.9, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true },
      );
      ScrollTrigger.create({
        trigger: box,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          if (self.isActive) {
            driftX.play();
            driftY.play();
          } else {
            driftX.pause();
            driftY.pause();
          }
        },
      });
      hover.current = {
        px: gsap.quickTo(box, "--px", { duration: 0.5, ease: "power3" }),
        py: gsap.quickTo(box, "--py", { duration: 0.5, ease: "power3" }),
      };
    },
    { scope: boxRef },
  );

  const local = (e: PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onEnter = (e: PointerEvent) => {
    const box = boxRef.current;
    if (!box || e.pointerType !== "mouse" || !hover.current) return;
    const { x, y } = local(e);
    gsap.set(box, { "--px": x, "--py": y });
    gsap.to(box, { "--h": 1, "--r": box.clientWidth * 0.2, duration: 0.8, ease: "power3.out", overwrite: "auto" });
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !hover.current) return;
    const { x, y } = local(e);
    hover.current.px(x);
    hover.current.py(y);
  };
  const onLeave = (e: PointerEvent) => {
    const box = boxRef.current;
    if (!box || e.pointerType !== "mouse" || !hover.current) return;
    gsap.to(box, { "--h": 0, "--r": box.clientWidth * 0.16, duration: 1.1, ease: "power3.inOut", overwrite: "auto" });
  };

  const fontSize = size ? `${size}px` : "12.4vw";
  const maskStyle: CSSProperties = { fontSize, maskImage: MASK, WebkitMaskImage: MASK };

  return (
    <div
      ref={boxRef}
      aria-hidden
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative select-none overflow-x-clip"
    >
      <span ref={measureRef} className={`text-outline ${typeClass}`} style={{ fontSize }}>
        {text}
      </span>
      <span className={`text-signal-gradient pointer-events-none absolute left-0 top-0 ${typeClass}`} style={maskStyle}>
        {text}
      </span>
    </div>
  );
}
