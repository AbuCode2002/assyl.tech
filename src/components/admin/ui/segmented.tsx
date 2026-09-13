import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SegmentItem = { value: string; label: ReactNode; href: string; icon?: ReactNode };

/** Link-based segmented control (state lives in the URL). */
export function Segmented({ items, value, className, size = "md" }: { items: SegmentItem[]; value: string; className?: string; size?: "sm" | "md" }) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-carbon p-0.5", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Link
            key={item.value}
            href={item.href}
            role="tab"
            aria-selected={active}
            scroll={false}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors",
              size === "sm" ? "h-7 px-3 text-[12px]" : "h-8 px-3.5 text-[13px]",
              active ? "bg-steel text-fg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]" : "text-dim hover:text-fg",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Build a URL keeping current search params and overriding some. */
export function withParams(
  pathname: string,
  current: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | null | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (typeof v === "string" && v) params.set(k, v);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null || v === undefined || v === "") params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
