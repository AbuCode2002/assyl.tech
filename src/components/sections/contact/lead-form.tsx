"use client";

import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useLenis } from "@/components/providers/smooth-scroll";
import { ArrowIcon, MagneticButton } from "@/components/ui/magnetic-button";
import { HudCorners } from "@/components/ui/hud";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { getSessionId, getVisitorId, track } from "@/lib/tracker";
import { SELECT_SERVICE_EVENT } from "../_shared/events";
import {
  BUDGET_OPTIONS,
  isServiceId,
  SERVICE_OPTIONS,
  TIMELINE_OPTIONS,
  type BudgetId,
  type ServiceId,
  type TimelineId,
} from "../_shared/lead-options";
import { Chip, ConsentField, FormGroup, TextAreaField, TextField } from "./form-controls";
import { LeadSuccess } from "./lead-success";

const MESSAGE_MAX = 3000;

type Values = {
  name: string;
  phone: string;
  telegram: string;
  email: string;
  company: string;
  message: string;
  services: ServiceId[];
  budget: BudgetId | "";
  timeline: TimelineId | "";
  consent: boolean;
  website: string;
};

const EMPTY: Values = {
  name: "",
  phone: "",
  telegram: "",
  email: "",
  company: "",
  message: "",
  services: [],
  budget: "",
  timeline: "",
  consent: false,
  website: "",
};

type FieldName = "name" | "phone" | "telegram" | "email" | "company" | "message" | "consent" | "contact";
type ErrorKey = "nameRequired" | "nameShort" | "nameLong" | "phone" | "email" | "telegram" | "contact" | "consent" | "message";
type Errors = Partial<Record<FieldName, ErrorKey>>;
type Notice = "summary" | "rate" | "network" | "server";
type Status = "idle" | "sending" | "success";

const PHONE_RE = /^[+\d][\d\s()-]{5,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const FOCUS_ORDER: FieldName[] = ["name", "phone", "telegram", "email", "company", "message", "consent"];

/** Mirrors `leadInputSchema` so users get instant, localized feedback. The server stays the authority. */
function validate(v: Values): Errors {
  const e: Errors = {};
  const name = v.name.trim();
  if (!name) e.name = "nameRequired";
  else if (name.length < 2) e.name = "nameShort";
  else if (name.length > 80) e.name = "nameLong";
  const phone = v.phone.trim();
  const email = v.email.trim();
  const telegram = v.telegram.trim();
  if (phone && (!PHONE_RE.test(phone) || phone.length > 40)) e.phone = "phone";
  if (email && (!EMAIL_RE.test(email) || email.length > 120)) e.email = "email";
  if (telegram.length > 64) e.telegram = "telegram";
  if (!phone && !email && !telegram) e.contact = "contact";
  if (v.message.length > MESSAGE_MAX) e.message = "message";
  if (!v.consent) e.consent = "consent";
  return e;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const optional = (s: string) => s.trim() || undefined;

export function LeadForm() {
  const t = useTranslations("contact.form");
  const tc = useTranslations("common");
  const locale = useLocale();
  const lenis = useLenis();

  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);
  const formStarted = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [leadNumber, setLeadNumber] = useState<number | null>(null);
  const [flash, setFlash] = useState<ServiceId | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    return () => clearTimeout(flashTimer.current);
  }, []);

  const errors = validate(values);
  const errorFor = (k: FieldName) => {
    const key = serverErrors[k] ?? (touched[k] || submitted ? errors[k] : undefined);
    return key ? t(`errors.${key}`) : undefined;
  };
  const contactTouched = touched.phone && touched.telegram && touched.email;
  const contactErrorKey = serverErrors.contact ?? (submitted || contactTouched ? errors.contact : undefined);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setServerErrors((s) => {
      if (!s[key as FieldName] && !(s.contact && (key === "phone" || key === "email" || key === "telegram"))) return s;
      const next = { ...s };
      delete next[key as FieldName];
      if (key === "phone" || key === "email" || key === "telegram") delete next.contact;
      return next;
    });
  };
  const blur = (k: FieldName) => setTouched((s) => (s[k] ? s : { ...s, [k]: true }));

  const toggleService = (id: ServiceId) =>
    setValues((v) => ({
      ...v,
      services: v.services.includes(id) ? v.services.filter((s) => s !== id) : [...v.services, id],
    }));

  const scrollToEl = (el: HTMLElement, offset = -110) => {
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.2 });
    else el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const focusFirstInvalid = (errs: Errors) => {
    const first = FOCUS_ORDER.find((k) => errs[k] || (k === "phone" && errs.contact));
    const el = first ? formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`) : null;
    if (!el) return;
    el.focus({ preventScroll: true });
    scrollToEl(el.closest("fieldset") ?? el, -120);
  };

  const onFirstFocus = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    track("form_start");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    setSubmitted(true);
    const errs = validate(values);
    if (Object.keys(errs).length > 0) {
      setNotice("summary");
      focusFirstInvalid(errs);
      return;
    }

    setStatus("sending");
    setNotice(null);
    setServerErrors({});

    const payload = {
      name: values.name.trim(),
      phone: optional(values.phone),
      telegram: optional(values.telegram),
      email: optional(values.email),
      company: optional(values.company),
      services: values.services,
      budget: values.budget || undefined,
      timeline: values.timeline || undefined,
      message: optional(values.message),
      consent: true as const,
      locale,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      page: window.location.pathname,
      website: values.website,
      startedAt: startedAt.current,
    };

    try {
      const [res] = await Promise.all([
        fetch("/api/lead", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }),
        wait(prefersReducedMotion() ? 0 : 900),
      ]);
      const data = (await res.json().catch(() => null)) as
        | { ok: true; number?: number }
        | { ok: false; error?: string; fields?: string[] }
        | null;

      if (res.ok && data?.ok) {
        setLeadNumber(typeof data.number === "number" && data.number > 0 ? data.number : null);
        setStatus("success");
        const panel = panelRef.current;
        if (panel && panel.getBoundingClientRect().top < 0) scrollToEl(panel, -96);
        return;
      }

      setStatus("idle");
      if (res.status === 429) {
        setNotice("rate");
      } else if (res.status === 422 && data && !data.ok && Array.isArray(data.fields)) {
        const mapped: Errors = {};
        const noContact = !payload.phone && !payload.email && !payload.telegram;
        for (const field of data.fields) {
          const root = field.split(".")[0];
          if (root === "name") mapped.name = "nameShort";
          else if (root === "phone") mapped[noContact ? "contact" : "phone"] = noContact ? "contact" : "phone";
          else if (root === "email") mapped.email = "email";
          else if (root === "telegram") mapped.telegram = "telegram";
          else if (root === "message") mapped.message = "message";
          else if (root === "consent") mapped.consent = "consent";
        }
        setServerErrors(mapped);
        setNotice(Object.keys(mapped).length > 0 ? "summary" : "server");
        focusFirstInvalid(mapped);
      } else {
        setNotice("server");
      }
    } catch {
      setStatus("idle");
      setNotice("network");
    }
  };

  const reset = () => {
    // keep who they are, clear what the request was about
    setValues((v) => ({ ...EMPTY, name: v.name, phone: v.phone, telegram: v.telegram, email: v.email, company: v.company, consent: v.consent }));
    setTouched({});
    setSubmitted(false);
    setServerErrors({});
    setNotice(null);
    setLeadNumber(null);
    setStatus("idle");
    startedAt.current = Date.now();
    const textarea = formRef.current?.querySelector<HTMLTextAreaElement>("textarea");
    if (textarea) textarea.style.height = "";
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[name="message"]')?.focus({ preventScroll: true }));
  };

  // Cross-section contract: Services rows ask the form to pre-select a service.
  const onSelectService = useEffectEvent((event: CustomEvent<ServiceId>) => {
    const id = event.detail;
    if (!isServiceId(id)) return;
    event.preventDefault();
    if (status === "success") reset();
    setValues((v) => (v.services.includes(id) ? v : { ...v, services: [...v.services, id] }));
    setFlash(id);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1900);
    if (panelRef.current) scrollToEl(panelRef.current, -96);
  });

  useEffect(() => {
    const handler = (event: CustomEvent<ServiceId>) => onSelectService(event);
    window.addEventListener(SELECT_SERVICE_EVENT, handler);
    return () => window.removeEventListener(SELECT_SERVICE_EVENT, handler);
  }, []);

  // Sending scanner + success morph.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      if (status === "sending") {
        gsap.fromTo("[data-scan-bar]", { xPercent: -100 }, { xPercent: 400, duration: 1.1, repeat: -1, ease: "power2.inOut" });
        return;
      }
      if (status !== "success") return;
      const body = panelRef.current?.querySelector<HTMLElement>("[data-body]");
      gsap
        .timeline()
        .fromTo("[data-form-layer]", { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.985, duration: 0.5, ease: "power2.out" }, 0)
        .fromTo("[data-success-layer]", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.05, ease: "expo.inOut" }, 0.05)
        .fromTo("[data-success-scan]", { y: 0, opacity: 1 }, { y: () => body?.offsetHeight ?? 0, duration: 1.05, ease: "expo.inOut" }, 0.05)
        .to("[data-success-scan]", { opacity: 0, duration: 0.25 }, ">-0.2")
        .fromTo("[data-check]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, stagger: 0.25, ease: "expo.out" }, 0.55)
        .fromTo("[data-success-reveal]", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.07, ease: "expo.out" }, 0.6);
    },
    { scope: panelRef, dependencies: [status], revertOnUpdate: true },
  );

  const sending = status === "sending";
  const success = status === "success";
  const header = sending ? t("headerSending") : success ? t("headerSent") : t("header");

  return (
    <div ref={panelRef} id="lead-form" className="glass relative scroll-mt-24">
      <HudCorners size={14} className="-inset-px" color="border-fg/45" />

      {/* terminal header */}
      <div className="relative flex h-11 items-center justify-between gap-4 border-b border-line px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 font-mono text-[11px] tracking-[0.08em]">
          <span aria-hidden className={cn("h-3 w-[3px] shrink-0", success ? "bg-ok" : "bg-signal", sending && "animate-blink")} />
          <span className="truncate text-fg" aria-live="polite">
            {header}
          </span>
        </div>
        <div aria-hidden className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={sending ? { animationDelay: `${i * 160}ms` } : undefined}
              className={cn(
                "size-2 rounded-full transition-colors duration-500",
                success ? "bg-ok" : i === 2 ? "bg-ion" : "bg-fg/20",
                sending && "animate-pulse bg-ion",
              )}
            />
          ))}
        </div>
        <span aria-hidden className={cn("absolute inset-x-0 -bottom-px h-px overflow-hidden", sending ? "opacity-100" : "opacity-0")}>
          <span data-scan-bar className="absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-transparent via-ion to-transparent" />
        </span>
      </div>

      <div data-body className="relative">
        <div
          data-form-layer
          inert={success}
          aria-hidden={success || undefined}
          className={cn("origin-top", success && "pointer-events-none opacity-0")}
        >
          <form
            ref={formRef}
            noValidate
            onSubmit={onSubmit}
            onFocus={onFirstFocus}
            aria-busy={sending || undefined}
            className="flex flex-col gap-10 p-5 sm:p-8 lg:p-10"
          >
            <FormGroup index="01" label={t("groups.contact")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  className="sm:col-span-2"
                  name="name"
                  label={t("fields.name")}
                  required
                  autoComplete="name"
                  maxLength={80}
                  enterKeyHint="next"
                  value={values.name}
                  onChange={(v) => set("name", v)}
                  onBlur={() => blur("name")}
                  error={errorFor("name")}
                />
                <TextField
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={40}
                  label={t("fields.phone")}
                  value={values.phone}
                  onChange={(v) => set("phone", v)}
                  onBlur={() => blur("phone")}
                  error={errorFor("phone")}
                  invalid={Boolean(contactErrorKey)}
                  describedBy="lead-contact-hint"
                />
                <TextField
                  name="telegram"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={64}
                  label={t("fields.telegram")}
                  hint={t("hints.telegram")}
                  value={values.telegram}
                  onChange={(v) => set("telegram", v)}
                  onBlur={() => blur("telegram")}
                  error={errorFor("telegram")}
                  invalid={Boolean(contactErrorKey)}
                  describedBy="lead-contact-hint"
                />
                <TextField
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={120}
                  label={t("fields.email")}
                  value={values.email}
                  onChange={(v) => set("email", v)}
                  onBlur={() => blur("email")}
                  error={errorFor("email")}
                  invalid={Boolean(contactErrorKey)}
                  describedBy="lead-contact-hint"
                />
                <TextField
                  name="company"
                  autoComplete="organization"
                  maxLength={120}
                  label={t("fields.company")}
                  optionalLabel={t("optional")}
                  value={values.company}
                  onChange={(v) => set("company", v)}
                  onBlur={() => blur("company")}
                />
              </div>
              <p
                id="lead-contact-hint"
                role={contactErrorKey ? "alert" : undefined}
                className={cn(
                  "mt-3 flex items-start gap-2 pl-1 font-mono text-[11px] leading-relaxed tracking-[0.02em] transition-colors",
                  contactErrorKey ? "text-danger" : "text-mute",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-[3px] grid size-3.5 shrink-0 place-items-center rounded-full border text-[8px] leading-none",
                    contactErrorKey ? "border-danger/60" : "border-line-strong",
                  )}
                >
                  {contactErrorKey ? "!" : "i"}
                </span>
                {contactErrorKey ? t("errors.contact") : t("contactHint")}
              </p>
            </FormGroup>

            <FormGroup index="02" label={t("groups.services")} hint={t("servicesHint")}>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((id) => (
                  <Chip
                    key={id}
                    type="checkbox"
                    name="services"
                    value={id}
                    label={tc(`services.${id}`)}
                    checked={values.services.includes(id)}
                    flash={flash === id}
                    onChange={() => toggleService(id)}
                  />
                ))}
              </div>
            </FormGroup>

            <FormGroup index="03" label={t("groups.budget")}>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((id) => (
                  <Chip
                    key={id}
                    type="radio"
                    name="budget"
                    value={id}
                    label={t(`budget.${id}`)}
                    checked={values.budget === id}
                    onChange={() => set("budget", id)}
                  />
                ))}
              </div>
            </FormGroup>

            <FormGroup index="04" label={t("groups.timeline")}>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map((id) => (
                  <Chip
                    key={id}
                    type="radio"
                    name="timeline"
                    value={id}
                    label={t(`timeline.${id}`)}
                    checked={values.timeline === id}
                    onChange={() => set("timeline", id)}
                  />
                ))}
              </div>
            </FormGroup>

            <FormGroup index="05" label={t("groups.message")}>
              <TextAreaField
                name="message"
                label={t("fields.message")}
                hint={t("hints.message")}
                max={MESSAGE_MAX}
                value={values.message}
                onChange={(v) => set("message", v)}
                onBlur={() => blur("message")}
                error={errorFor("message")}
              />
            </FormGroup>

            {/* honeypot — humans never see or reach it */}
            <div aria-hidden className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={values.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </div>

            <ConsentField
              label={t("consent")}
              checked={values.consent}
              onChange={(v) => {
                set("consent", v);
                blur("consent");
              }}
              error={errorFor("consent")}
            />

            <div className="flex flex-col-reverse gap-5 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="assertive" className="min-h-5 font-mono text-[11px] leading-relaxed tracking-[0.02em]">
                {notice && (
                  <p className={cn("flex items-start gap-2", notice === "summary" ? "text-warn" : "text-danger")}>
                    <span aria-hidden>!</span>
                    {t(`errors.${notice}`)}
                  </p>
                )}
              </div>
              <MagneticButton
                type="submit"
                size="lg"
                disabled={sending}
                data-track-click="contact-submit"
                className="w-full shrink-0 disabled:cursor-wait sm:w-auto"
                icon={sending ? <span className="block size-1.5 animate-blink rounded-full bg-white" /> : <ArrowIcon />}
              >
                {sending ? t("sending") : t("submit")}
              </MagneticButton>
            </div>
          </form>
        </div>

        {success && (
          <div data-success-layer className="absolute inset-0 overflow-hidden">
            <span
              data-success-scan
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-ion opacity-0 shadow-[0_0_24px_3px_rgb(86_225_255/0.6)]"
            />
            <LeadSuccess number={leadNumber} onAgain={reset} />
          </div>
        )}
      </div>
    </div>
  );
}
