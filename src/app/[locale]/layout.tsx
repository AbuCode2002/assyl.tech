import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Noto_Sans_Mono, Unbounded } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { htmlLang, routing, type Locale } from "@/i18n/routing";
import { contactLinks, site } from "@/lib/site";
import { Analytics } from "@/components/providers/analytics";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import "../globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-unbounded",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-manrope",
  display: "swap",
});
// JetBrains Mono has no Ә, Ғ, Қ, Ң, Ұ, Һ — those fall through to Noto Sans Mono, which keeps the
// monospace rhythm. adjustFontFallback is off so the generated fallback family does not win first.
const notoMono = Noto_Sans_Mono({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500"],
  variable: "--font-noto-mono",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-jetbrains",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Noto Sans Mono", "ui-monospace", "monospace"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#030407",
  colorScheme: "dark",
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.meta" });
  const path = locale === routing.defaultLocale ? "/" : `/${locale}`;
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s — ${site.name}` },
    description: t("description"),
    alternates: {
      canonical: path,
      languages: { ru: "/", kk: "/kz", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: t("title"),
      description: t("description"),
      url: path,
      locale: htmlLang[locale as keyof typeof htmlLang],
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    // Google Search Console ownership: set GOOGLE_SITE_VERIFICATION to the code from the "HTML tag" method
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

/** Structured data: who we are, what we do and how to reach us — read by search engines. */
function organizationJsonLd(locale: Locale, description: string, services: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${site.url}/#studio`,
    name: site.name,
    url: site.url,
    description,
    email: site.contacts.email,
    telephone: site.contacts.phone,
    image: `${site.url}/icon.svg`,
    address: { "@type": "PostalAddress", addressLocality: site.city[locale], addressCountry: "KZ" },
    areaServed: "KZ",
    sameAs: [contactLinks.instagram, contactLinks.telegram],
    knowsLanguage: ["ru", "kk", "en"],
    makesOffer: services.map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });
  const services = Object.values(t.raw("services") as Record<string, string>).filter((n) => n !== t("services.other"));
  const jsonLd = organizationJsonLd(locale, t("meta.description"), services);

  return (
    <html lang={htmlLang[locale]} className={`${unbounded.variable} ${manrope.variable} ${jetbrains.variable} ${notoMono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh overflow-x-clip">
        <NextIntlClientProvider>
          <SmoothScroll>{children}</SmoothScroll>
          <Analytics />
        </NextIntlClientProvider>
        <div aria-hidden className="grain-overlay" />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
