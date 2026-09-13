import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "kz", "en"],
  defaultLocale: "ru",
  localePrefix: "as-needed",
  // "/" is always Russian (main market); visitors switch language explicitly.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** BCP-47 tag for <html lang> — the URL uses "kz", the language code is "kk". */
export const htmlLang: Record<Locale, string> = { ru: "ru", kz: "kk", en: "en" };
