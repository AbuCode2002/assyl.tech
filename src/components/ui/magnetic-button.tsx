"use client";

import { useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "light";

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: "md" | "lg";
  href?: string;
  className?: string;
  strength?: number;
  icon?: ReactNode;
} & Omit<ComponentProps<"button">, "ref"> &
  Pick<ComponentProps<"a">, "target" | "rel">;

const variants: Record<Variant, string> = {
  primary: "bg-signal text-white signal-glow",
  ghost: "border border-line-strong text-fg hover:border-fg/40",
  light: "bg-fg text-void",
};

/**
 * Pill button that leans toward the cursor; a fill sweeps up from the bottom on hover
 * and the label rolls to a duplicate.
 */
export function MagneticButton({ children, variant = "primary", size = "md", href, className, strength = 0.35, icon, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (inner.current) inner.current.style.transform = `translate3d(${x * 0.35}px, ${y * 0.35}px, 0)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
    if (inner.current) inner.current.style.transform = "";
  };

  const classes = cn(
    "group/btn relative inline-flex select-none items-center justify-center overflow-hidden rounded-full font-mono uppercase tracking-[0.14em]",
    "transition-[transform,border-color,background-color] duration-500 ease-out-expo",
    size === "lg" ? "h-14 px-8 text-[12px]" : "h-11 px-6 text-[11px]",
    variants[variant],
    className,
  );

  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 translate-y-[101%] rounded-[inherit] transition-transform duration-700 ease-out-expo group-hover/btn:translate-y-0",
          variant === "primary" ? "bg-[#6b9bff]" : variant === "light" ? "bg-signal" : "bg-fg",
        )}
      />
      <span ref={inner} className="relative flex items-center gap-3 transition-transform duration-500 ease-out-expo">
        <span className="relative block overflow-hidden">
          <span className="block transition-transform duration-500 ease-out-expo group-hover/btn:-translate-y-full">
            {children}
          </span>
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 block translate-y-full transition-transform duration-500 ease-out-expo group-hover/btn:translate-y-0",
              variant === "ghost" && "text-void",
              variant === "light" && "text-white",
            )}
          >
            {children}
          </span>
        </span>
        {icon && (
          <span className={cn("relative transition-colors duration-500", variant === "ghost" && "group-hover/btn:text-void", variant === "light" && "group-hover/btn:text-white")}>
            {icon}
          </span>
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={rest.target}
        rel={rest.rel}
        className={classes}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={rest.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        {...(rest["aria-label"] ? { "aria-label": rest["aria-label"] } : {})}
        {...Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith("data-")))}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={classes}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      {...rest}
    >
      {content}
    </button>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-3.5", className)} fill="none" aria-hidden>
      <path d="M3 13 13 3M5.5 3H13v7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}
