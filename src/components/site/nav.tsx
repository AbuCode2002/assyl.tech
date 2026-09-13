"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useLenis, useScrollTo } from "@/components/providers/smooth-scroll";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { ArrowIcon, MagneticButton } from "@/components/ui/magnetic-button";
import { ScrambleText } from "@/components/ui/scramble-text";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { contactLinks } from "@/lib/site";
import { track } from "@/lib/tracker";

const LINKS = ["works", "services", "process", "contact"] as const;

function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className={cn("flex items-center font-mono text-[11px] uppercase tracking-[0.14em]", className)}>
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="px-1.5 text-mute">/</span>}
          <button
            type="button"
            aria-current={l === locale}
            onClick={() => {
              if (l === locale) return;
              track("locale", l);
              router.replace(pathname, { locale: l as Locale, scroll: false });
            }}
            className={cn("transition-colors", l === locale ? "text-fg" : "text-mute hover:text-dim")}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}

export function Nav() {
  const t = useTranslations("nav");
  const scrollTo = useScrollTo();
  const lenis = useLenis();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 160 && y > lastY.current + 4 ? true : y < lastY.current - 4 ? false : (h) => h);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = LINKS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const timer = setTimeout(() => {
      LINKS.map((id) => document.getElementById(id)).forEach((el) => el && io.observe(el));
    }, 2000);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lenis]);

  const go = (id: string) => {
    setOpen(false);
    scrollTo(`#${id}`);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-transform duration-700 ease-out-expo",
          hidden && !open ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-b from-void/90 to-transparent transition-opacity duration-500",
            scrolled ? "opacity-100" : "opacity-0",
          )}
        />
        <nav className="container-x relative flex h-20 items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => (open ? go("hero") : scrollTo(0))}
            className="group flex items-center gap-3"
            aria-label="assyl.tech"
            data-track-click="nav-logo"
          >
            <LogoMark className="h-7 w-auto text-fg transition-transform duration-700 ease-out-expo group-hover:rotate-[-8deg]" />
            <Wordmark className="text-[15px]" />
          </button>

          <div className="glass absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full p-1.5 lg:flex">
            {LINKS.map((id, i) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                data-track-click={`nav-${id}`}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
                  active === id ? "bg-fg/[0.08] text-fg" : "text-dim hover:text-fg",
                )}
              >
                <span className={cn("text-[9px]", active === id ? "text-signal" : "text-mute")}>0{i + 1}</span>
                <ScrambleText text={t(id)} trigger="hover" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <LocaleSwitch className="hidden sm:flex" />
            <MagneticButton
              className="hidden md:inline-flex"
              icon={<ArrowIcon />}
              onClick={() => go("contact")}
              data-track-click="nav-cta"
            >
              {t("cta")}
            </MagneticButton>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? t("close") : t("menu")}
              className="relative flex size-11 items-center justify-center rounded-full border border-line-strong lg:hidden"
            >
              <span className={cn("absolute h-px w-4 bg-fg transition-transform duration-500 ease-out-expo", open ? "rotate-45" : "-translate-y-[3px]")} />
              <span className={cn("absolute h-px w-4 bg-fg transition-transform duration-500 ease-out-expo", open ? "-rotate-45" : "translate-y-[3px]")} />
            </button>
          </div>
        </nav>
      </header>

      {/* mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-void/[0.98] transition-[clip-path] duration-[900ms] ease-in-out-expo lg:hidden",
          open ? "[clip-path:inset(0_0_0_0)]" : "pointer-events-none [clip-path:inset(0_0_100%_0)]",
        )}
        aria-hidden={!open}
      >
        <div className="container-x flex h-full flex-col justify-between pb-10 pt-28">
          <ul className="flex flex-col gap-2">
            {LINKS.map((id, i) => (
              <li key={id} className="overflow-hidden">
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => go(id)}
                  className={cn(
                    "flex items-baseline gap-4 font-display text-[clamp(38px,11vw,72px)] font-medium leading-[1.05] tracking-[-0.03em] transition-transform duration-[900ms] ease-out-expo",
                    open ? "translate-y-0" : "translate-y-full",
                  )}
                  style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}
                >
                  <span className="mono-label text-signal">0{i + 1}</span>
                  {t(id)}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-6">
            <MagneticButton size="lg" icon={<ArrowIcon />} onClick={() => go("contact")} tabIndex={open ? 0 : -1}>
              {t("cta")}
            </MagneticButton>
            <div className="flex items-center justify-between">
              <div className="flex gap-5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                <a href={contactLinks.instagram} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
                  Instagram
                </a>
                <a href={contactLinks.telegram} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
                  Telegram
                </a>
                <a href={contactLinks.whatsapp} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
                  WhatsApp
                </a>
              </div>
              <LocaleSwitch />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
