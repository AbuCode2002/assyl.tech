"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS, titleFor } from "./nav-items";

export function SidebarNav({ newLeads }: { newLeads: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Разделы">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const count = item.badge === "newLeads" ? newLeads : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active ? "bg-graphite text-fg" : "text-dim hover:bg-graphite/60 hover:text-fg",
            )}
          >
            {active ? <span className="absolute top-2.5 bottom-2.5 left-0 w-[2px] rounded-full bg-signal" /> : null}
            <Icon size={18} className={active ? "text-signal" : "text-mute group-hover:text-dim"} />
            <span className="flex-1">{item.label}</span>
            {count > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[11px] font-semibold text-white tabular-nums">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar({ newLeads }: { newLeads: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const count = item.badge === "newLeads" ? newLeads : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors",
                active ? "text-fg" : "text-mute",
              )}
            >
              {active ? <span className="absolute top-0 h-[2px] w-8 rounded-full bg-signal" /> : null}
              <span className="relative">
                <Icon size={21} className={active ? "text-signal" : undefined} />
                {count > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-signal px-1 text-[9.5px] font-semibold text-white tabular-nums">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </span>
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopbarTitle() {
  const pathname = usePathname();
  return <span className="truncate text-sm font-semibold text-fg">{titleFor(pathname)}</span>;
}
