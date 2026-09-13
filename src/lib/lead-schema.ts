import { z } from "zod";

export const SERVICE_IDS = ["mobile", "web", "platform", "ai", "dashboard", "automation", "design", "other"] as const;
export const BUDGET_IDS = ["lt1m", "1to3m", "3to7m", "gt7m", "unknown"] as const;
export const TIMELINE_IDS = ["asap", "1to3", "3to6", "flex"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const leadInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: optionalText(40).refine((v) => !v || /^[+\d][\d\s()-]{5,}$/.test(v), "phone"),
    email: optionalText(120).refine((v) => !v || z.email().safeParse(v).success, "email"),
    telegram: optionalText(64),
    company: optionalText(120),
    services: z.array(z.enum(SERVICE_IDS)).max(SERVICE_IDS.length).default([]),
    budget: z.enum(BUDGET_IDS).optional(),
    timeline: z.enum(TIMELINE_IDS).optional(),
    message: optionalText(3000),
    consent: z.literal(true),
    locale: z.enum(["ru", "kz", "en"]).default("ru"),
    visitorId: optionalText(64),
    sessionId: optionalText(64),
    page: optionalText(300),
    /** honeypot — must stay empty */
    website: z.string().max(0).optional(),
    /** ms timestamp when the form was rendered */
    startedAt: z.number().optional(),
  })
  .refine((d) => d.phone || d.email || d.telegram, { message: "contact", path: ["phone"] });

export type LeadInput = z.input<typeof leadInputSchema>;
