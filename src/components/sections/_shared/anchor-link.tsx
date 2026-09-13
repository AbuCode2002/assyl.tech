"use client";

import type { ComponentProps } from "react";
import { useScrollTo } from "@/components/providers/smooth-scroll";

/** In-page `#anchor` link that scrolls through Lenis instead of jumping. */
export function AnchorLink({ href, onClick, ...rest }: ComponentProps<"a"> & { href: string }) {
  const scrollTo = useScrollTo();
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !href.startsWith("#") || e.metaKey || e.ctrlKey) return;
        if (!document.querySelector(href)) return;
        e.preventDefault();
        scrollTo(href);
      }}
      {...rest}
    />
  );
}
