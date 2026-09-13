import { useTranslations } from "next-intl";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { contactLinks, site } from "@/lib/site";
import { AnchorLink } from "./_shared/anchor-link";
import { BackToTop, FooterClock, FooterCta } from "./footer/footer-parts";
import { FooterWordmark } from "./footer/footer-wordmark";

const NAV = [
  { id: "works", href: "#works" },
  { id: "services", href: "#services" },
  { id: "process", href: "#process" },
  { id: "contact", href: "#contact" },
] as const;

const SOCIALS = [
  { id: "instagram", href: contactLinks.instagram, external: true },
  { id: "telegram", href: contactLinks.telegram, external: true },
  { id: "whatsapp", href: contactLinks.whatsapp, external: true },
  { id: "email", href: contactLinks.email, external: false },
] as const;

function LinkLabel({ children }: { children: string }) {
  return (
    <>
      <span aria-hidden className="h-px w-3 shrink-0 origin-left scale-x-0 bg-ion transition-transform duration-500 ease-out-expo group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100" />
      <span className="-ml-5 transition-[translate,color] duration-500 ease-out-expo group-hover/link:translate-x-5 group-hover/link:text-fg group-focus-visible/link:translate-x-5">
        {children}
      </span>
    </>
  );
}

const linkClass = "group/link inline-flex items-center gap-2 text-[15px] text-fg/75";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("contact");

  return (
    <footer data-track-section="footer" className="relative overflow-clip border-t border-line bg-void">
      <FooterCta />

      <div className="container-x">
        <div className="grid gap-12 border-t border-line py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10 lg:py-20">
          <div className="sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-3">
              <LogoMark className="h-7 w-auto text-fg" />
              <Wordmark className="text-[18px]" />
            </div>
            <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-dim">{t("tagline")}</p>
          </div>

          <nav aria-label={t("columns.nav")} className="lg:col-span-2 lg:col-start-7">
            <p className="mono-label text-mute">{t("columns.nav")}</p>
            <ul className="mt-5 flex flex-col gap-3">
              {NAV.map((item) => (
                <li key={item.id}>
                  <AnchorLink href={item.href} className={linkClass} data-track-click={`footer-nav-${item.id}`}>
                    <LinkLabel>{t(`nav.${item.id}`)}</LinkLabel>
                  </AnchorLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <p className="mono-label text-mute">{t("columns.social")}</p>
            <ul className="mt-5 flex flex-col gap-3">
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href}
                    target={s.external ? "_blank" : undefined}
                    rel={s.external ? "noopener noreferrer" : undefined}
                    data-track-click={`footer-${s.id}`}
                    className={linkClass}
                  >
                    <LinkLabel>{tc(`channels.${s.id}`)}</LinkLabel>
                    {s.external && <span className="sr-only"> ({tc("newTab")})</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-2">
            <p className="mono-label text-mute">{t("columns.studio")}</p>
            <p className="-mt-2 text-[15px] text-fg/75">{t("city")}</p>
            <p className="font-mono text-[11px] tracking-[0.08em] text-dim">{site.coords}</p>
            <FooterClock label={t("localTime")} />
          </div>
        </div>
      </div>

      <div className="px-[clamp(10px,1.4vw,22px)] pt-4">
        <FooterWordmark text={site.name.toUpperCase()} />
      </div>

      <div className="container-x">
        <div className="mt-[clamp(20px,3vw,40px)] flex flex-col gap-5 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="mono-label">{t("copyright")}</span>
          <span className="mono-label flex items-center gap-2">
            <span aria-hidden className="size-1.5 rotate-45 bg-signal" />
            {t("madeIn")}
          </span>
          <BackToTop label={t("backToTop")} />
        </div>
      </div>
    </footer>
  );
}
