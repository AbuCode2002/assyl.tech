import { useTranslations } from "next-intl";
import { SectionEyebrow, TickRail } from "@/components/ui/hud";
import { SERVICE_ROWS } from "./_shared/lead-options";
import { SplitHeading } from "./_shared/split-heading";
import { ServicesAccordion } from "./services/services-accordion";

export function Services() {
  const t = useTranslations("services");

  return (
    <section
      id="services"
      data-track-section="services"
      className="relative overflow-clip border-t border-line py-[clamp(96px,14vw,200px)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[20vw] top-[18%] size-[60vw] max-w-[900px] rounded-full bg-[radial-gradient(closest-side,rgb(59_123_255/0.09),transparent)]"
      />

      <div className="container-x relative">
        <header className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionEyebrow index="05">{t("eyebrow")}</SectionEyebrow>
            <SplitHeading
              text={t("title")}
              className="mt-8 font-display text-[clamp(36px,5.6vw,96px)] font-medium leading-[0.95] tracking-[-0.03em]"
            />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4 lg:col-start-9">
            <p className="max-w-[46ch] text-[clamp(16px,1.2vw,18px)] leading-relaxed text-dim">{t("intro")}</p>
            <div className="flex items-center gap-4">
              <span className="mono-label shrink-0 text-fg">{t("count", { count: SERVICE_ROWS.length })}</span>
              <TickRail count={24} className="h-3 flex-1 items-end" />
            </div>
          </div>
        </header>

        <ServicesAccordion className="mt-[clamp(56px,8vw,112px)]" />
      </div>
    </section>
  );
}
