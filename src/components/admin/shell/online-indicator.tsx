"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function OnlineIndicator({ initial, className }: { initial: number; className?: string }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/admin/api/online", { cache: "no-store", headers: { accept: "application/json" } });
        if (!res.ok || !res.headers.get("content-type")?.includes("json")) return;
        const json = (await res.json()) as { online?: number };
        if (!cancelled && typeof json.online === "number") setCount(json.online);
      } catch {
        /* offline — keep last value */
      }
    };
    const id = window.setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const live = count > 0;
  return (
    <Link
      href="/admin/visitors?online=1"
      title="Посетители на сайте за последние 2 минуты"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors",
        live ? "border-ok/25 bg-ok/[0.07] text-fg hover:bg-ok/[0.12]" : "border-line bg-carbon text-dim hover:text-fg",
        className,
      )}
    >
      <span className="relative flex size-2">
        {live ? <span className="absolute inset-0 animate-ping rounded-full bg-ok opacity-50" /> : null}
        <span className={cn("relative size-2 rounded-full", live ? "bg-ok" : "bg-mute")} />
      </span>
      <span className="tabular-nums">{count}</span>
      <span className="text-dim">онлайн</span>
    </Link>
  );
}
