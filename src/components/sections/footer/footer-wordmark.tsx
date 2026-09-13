"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";

const typeClass = "block w-max whitespace-nowrap font-display font-semibold leading-[0.8] tracking-[-0.045em]";

/**
 * Edge-to-edge outlined wordmark with a "lens" that reveals the gradient fill.
 * The lens is a small circular clip moved with transforms only (the fill inside counter-moves),
 * so nothing but the lens area is ever repainted — animating a full-width mask-image was far too heavy.
 */
export function FooterWordmark({ text }: { text: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | null>(null);
  const [radius, setRadius] = useState(160);
  const pos = useRef({ x: 0, y: 0, r: 160 });
  const hovering = useRef(false);
  const follow = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null);
  const driftRef = useRef<gsap.core.Timeline | null>(null);

  const apply = () => {
    const { x, y, r } = pos.current;
    if (lensRef.current) lensRef.current.style.transform = `translate3d(${x - r}px, ${y - r}px, 0)`;
    if (fillRef.current) fillRef.current.style.transform = `translate3d(${r - x}px, ${r - y}px, 0)`;
  };

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
        const r = Math.round(Math.max(90, box.clientWidth * 0.14));
        pos.current.r = r;
        setRadius(r);
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
      pos.current.x = box.clientWidth * 0.5;
      pos.current.y = box.clientHeight * 0.5;
      apply();
      if (prefersReducedMotion()) return;

      // idle Lissajous drift, only while the footer is on screen and not hovered
      const drift = gsap.timeline({ paused: true, repeat: -1, onUpdate: apply });
      drift
        .fromTo(pos.current, { x: () => box.clientWidth * 0.1 }, { x: () => box.clientWidth * 0.9, duration: 6.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0)
        .fromTo(pos.current, { y: () => box.clientHeight * 0.2 }, { y: () => box.clientHeight * 0.8, duration: 3.25, ease: "sine.inOut", yoyo: true, repeat: 3 }, 0);

      ScrollTrigger.create({
        trigger: box,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive && !hovering.current ? drift.play() : drift.pause()),
      });

      follow.current = {
        x: gsap.quickTo(pos.current, "x", { duration: 0.5, ease: "power3", onUpdate: apply }),
        y: gsap.quickTo(pos.current, "y", { duration: 0.5, ease: "power3", onUpdate: apply }),
      };
      driftRef.current = drift;
    },
    { scope: boxRef },
  );

  const local = (e: PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !follow.current) return;
    hovering.current = true;
    driftRef.current?.pause();
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !follow.current) return;
    const { x, y } = local(e);
    follow.current.x(x);
    follow.current.y(y);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    hovering.current = false;
    driftRef.current?.play();
  };

  const fontSize = size ? `${size}px` : "12.4vw";

  return (
    <div
      ref={boxRef}
      aria-hidden
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative select-none overflow-hidden"
    >
      <span ref={measureRef} className={`text-outline ${typeClass}`} style={{ fontSize }}>
        {text}
      </span>
      <div
        ref={lensRef}
        className="pointer-events-none absolute left-0 top-0 overflow-hidden rounded-full will-change-transform [mask-image:radial-gradient(circle,#000_40%,transparent_71%)]"
        style={{ width: radius * 2, height: radius * 2 }}
      >
        <span ref={fillRef} className={`text-signal-gradient absolute left-0 top-0 will-change-transform ${typeClass}`} style={{ fontSize }}>
          {text}
        </span>
      </div>
    </div>
  );
}
