"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowIcon } from "@/components/ui/magnetic-button";
import { cn } from "@/lib/cn";
import { contactLinks, site } from "@/lib/site";
import { useAlmatyClock } from "../_shared/use-almaty-clock";

type ChannelId = "instagram" | "telegram" | "whatsapp" | "email" | "phone";
type Channel = { id: ChannelId; href: string; value: string; external?: boolean; copy?: string };

/** "77000000000" → "+7 700 000 00 00" */
export function formatPhoneDigits(raw: string) {
  const d = raw.replace(/\D/g, "");
  return d.length === 11 ? `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}` : `+${d}`;
}

export function ContactChannels({ className }: { className?: string }) {
  const t = useTranslations("contact");
  const channels: Channel[] = [
    { id: "instagram", href: contactLinks.instagram, value: `@${site.contacts.instagram}`, external: true },
    { id: "telegram", href: contactLinks.telegram, value: `@${site.contacts.telegram}`, external: true },
    { id: "whatsapp", href: contactLinks.whatsapp, value: formatPhoneDigits(site.contacts.whatsapp), external: true },
    { id: "email", href: contactLinks.email, value: site.contacts.email, copy: site.contacts.email },
    { id: "phone", href: contactLinks.phone, value: site.contacts.phone, copy: site.contacts.phone },
  ];

  return (
    <div className={className}>
      <span className="mono-label">{t("channelsLabel")}</span>
      <ul className="mt-4 border-t border-line">
        {channels.map((c) => (
          <li key={c.id} className="group/ch relative flex items-center gap-3 border-b border-line">
            <span
              aria-hidden
              className="absolute -bottom-px left-0 h-px w-full origin-left scale-x-0 bg-linear-to-r from-signal via-ion to-transparent transition-transform duration-700 ease-out-expo group-focus-within/ch:scale-x-100 group-hover/ch:scale-x-100"
            />
            <a
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              data-track-click={`contact-${c.id}`}
              className="flex min-w-0 flex-1 flex-col gap-1.5 py-4 outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline focus-visible:after:outline-1 focus-visible:after:-outline-offset-1 focus-visible:after:outline-ion sm:flex-row sm:items-center sm:gap-6 sm:py-5 lg:flex-col lg:items-start lg:gap-1.5 xl:flex-row xl:items-center xl:gap-6"
            >
              <span className="mono-label w-24 shrink-0 transition-colors duration-500 group-hover/ch:text-signal">
                {t(`channels.${c.id}`)}
              </span>
              <span className="min-w-0 truncate font-display text-[clamp(16px,1.5vw,22px)] font-medium tracking-[-0.02em] text-fg transition-[translate] duration-500 ease-out-expo group-hover/ch:translate-x-2">
                {c.value}
              </span>
              {c.external && <span className="sr-only"> ({t("newTab")})</span>}
            </a>
            {c.copy && <CopyButton value={c.copy} id={c.id} />}
            <span
              aria-hidden
              className="pointer-events-none grid size-9 shrink-0 place-items-center rounded-full border border-line-strong transition-[rotate,background-color,border-color] duration-500 ease-out-expo group-hover/ch:rotate-45 group-hover/ch:border-signal group-hover/ch:bg-signal"
            >
              <ArrowIcon />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyButton({ value, id }: { value: string; id: string }) {
  const t = useTranslations("contact");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={t("copyAria", { value })}
        data-track-click={`contact-copy-${id}`}
        className={cn(
          "relative z-10 flex h-9 shrink-0 items-center gap-2 rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-300 sm:px-3",
          copied ? "border-ok/50 text-ok" : "border-line text-dim hover:border-line-strong hover:text-fg",
        )}
      >
        <span aria-hidden className="relative grid size-3.5 place-items-center">
          <svg
            viewBox="0 0 14 14"
            fill="none"
            className={cn("absolute size-3.5 transition-[opacity,scale] duration-300", copied ? "scale-50 opacity-0" : "opacity-100")}
          >
            <rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" />
            <path d="M9.5 2.5V2A1 1 0 0 0 8.5 1H3a2 2 0 0 0-2 2v5.5a1 1 0 0 0 1 1h.5" stroke="currentColor" />
          </svg>
          <svg
            viewBox="0 0 14 14"
            fill="none"
            className={cn("absolute size-3.5 transition-[opacity,scale] duration-300", copied ? "opacity-100" : "scale-50 opacity-0")}
          >
            <path d="m2.5 7.3 3 3 6-6.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span aria-hidden className="relative hidden h-[14px] overflow-hidden leading-[14px] sm:block lg:hidden 2xl:block">
          <span className={cn("block transition-transform duration-500 ease-out-expo", copied && "-translate-y-1/2")}>
            <span className="block">{t("copy")}</span>
            <span className="block">{t("copied")}</span>
          </span>
        </span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? t("copied") : ""}
      </span>
    </>
  );
}

export function ContactTelemetry({ className }: { className?: string }) {
  const t = useTranslations("contact");
  const { time, offset } = useAlmatyClock();
  return (
    <dl className={cn("grid grid-cols-2 border border-line bg-carbon/40", className)}>
      <div className="relative border-r border-line p-4 sm:p-5">
        <dt className="mono-label">{t("localTime")}</dt>
        <dd className="mt-3 flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-[clamp(18px,1.7vw,24px)] tabular-nums text-fg">{time}</span>
          <span className="font-mono text-[10px] tracking-[0.1em] text-mute">{offset}</span>
        </dd>
      </div>
      <div className="p-4 sm:p-5">
        <dt className="mono-label">{t("coords")}</dt>
        <dd className="mt-3 font-mono text-[12px] leading-relaxed tracking-[0.06em] text-fg">{site.coords}</dd>
      </div>
    </dl>
  );
}
