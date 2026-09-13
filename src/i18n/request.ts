import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Messages are split per section so separate parts of the landing can be
 * edited independently: src/messages/<locale>/<namespace>.json
 */
export const namespaces = [
  "common",
  "nav",
  "hero",
  "about",
  "showcase",
  "works",
  "services",
  "process",
  "contact",
  "footer",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const entries = await Promise.all(
    namespaces.map(async (ns) => [ns, (await import(`../messages/${locale}/${ns}.json`)).default] as const),
  );

  return { locale, messages: Object.fromEntries(entries) };
});
