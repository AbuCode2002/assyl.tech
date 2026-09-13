import { useTranslations } from "next-intl";
import { SectionEyebrow, StatusDot } from "@/components/ui/hud";
import { SplitHeading } from "./_shared/split-heading";
import { ContactChannels, ContactTelemetry } from "./contact/contact-channels";
import { LeadForm } from "./contact/lead-form";

export function Contact() {
  const t = useTranslations("contact");

  return (
    <section
      id="contact"
      data-track-section="contact"
      className="relative overflow-clip border-t border-line py-[clamp(96px,14vw,200px)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-[30%] -left-[15%] size-[70vw] max-w-[1100px] rounded-full bg-[radial-gradient(closest-side,rgb(59_123_255/0.12),transparent)]" />
        <div className="absolute right-[-10%] top-[10%] size-[40vw] max-w-[640px] rounded-full bg-[radial-gradient(closest-side,rgb(86_225_255/0.05),transparent)]" />
      </div>

      <div className="container-x relative grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col lg:col-span-5">
          <SectionEyebrow index="07">{t("eyebrow")}</SectionEyebrow>
          <SplitHeading
            text={t("title")}
            className="mt-8 font-display text-[clamp(38px,4.7vw,80px)] font-medium leading-[0.95] tracking-[-0.035em]"
          />
          <p className="mt-6 max-w-[40ch] text-[clamp(16px,1.3vw,19px)] leading-relaxed text-dim">{t("subtitle")}</p>
          <StatusDot className="mt-6 self-start">{t("status")}</StatusDot>

          <ContactChannels className="mt-12 lg:mt-16" />
          <div className="mt-10 lg:mt-auto lg:pt-12">
            <ContactTelemetry />
          </div>
        </div>

        <div className="lg:col-span-7">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
