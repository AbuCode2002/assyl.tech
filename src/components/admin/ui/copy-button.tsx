"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { IconCheck, IconCopy } from "./icons";

export function CopyButton({ value, label = "Скопировать", className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      title={copied ? "Скопировано" : label}
      aria-label={copied ? "Скопировано" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = value;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
      }}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
        copied ? "text-ok" : "text-mute hover:bg-graphite hover:text-fg",
        className,
      )}
    >
      {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
    </button>
  );
}
