import { useLocale, useTranslations } from "next-intl";
import { SectionEyebrow } from "@/components/ui/hud";
import { projects } from "@/content/projects";
import type { Locale } from "@/i18n/routing";
import { pad2 } from "./_shared/lead-options";
import { SplitHeading } from "./_shared/split-heading";
import type { WorkItem } from "./works/types";
import { WorksIndex } from "./works/works-index";

/** Decorative addresses for the browser frame. Consider moving to `Project.url`. */
const FRAME_URLS: Record<string, string> = {
  "farabi-dashboard": "farabi.ai/svodka",
  "farabi-assistant": "farabi.ai/assistant",
};

export function Works() {
  const t = useTranslations("works");
  const locale = useLocale() as Locale;

  const items: WorkItem[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    client: p.client[locale],
    category: p.category[locale],
    year: p.year,
    platform: p.platform,
    poster: p.poster,
    video: p.video,
    stills: p.stills ?? [],
    summary: p.summary[locale],
    features: p.features[locale],
    stack: p.stack,
    accent: p.accent,
    url: FRAME_URLS[p.id] ?? `${p.id}.app`,
  }));

  return (
    <section
      id="works"
      data-track-section="works"
      className="relative border-t border-line py-[clamp(96px,14vw,200px)]"
    >
      {/* faint column grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="container-x grid h-full grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="border-l border-line/50 last:border-r max-lg:[&:nth-child(n+5)]:hidden" />
          ))}
        </div>
      </div>

      <div className="container-x relative">
        <header className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionEyebrow index="04">{t("eyebrow")}</SectionEyebrow>
            <SplitHeading
              text={t("title")}
              className="mt-8 font-display text-[clamp(36px,5.6vw,96px)] font-medium leading-[0.95] tracking-[-0.03em]"
            />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4 lg:col-start-9">
            <p className="max-w-[46ch] text-[clamp(16px,1.2vw,18px)] leading-relaxed text-dim">{t("intro")}</p>
            <div className="mono-label flex items-center gap-3">
              <span className="text-fg tabular-nums">{pad2(items.length)}</span>
              <span aria-hidden className="h-px flex-1 bg-line" />
              <span>{t("indexLabel")}</span>
            </div>
          </div>
        </header>

        <WorksIndex items={items} />
      </div>
    </section>
  );
}
