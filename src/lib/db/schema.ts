import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const ts = (name?: string) => (name ? timestamp(name, { withTimezone: true }) : timestamp({ withTimezone: true }));

export const leadStatus = pgEnum("lead_status", ["new", "in_progress", "proposal", "won", "lost", "spam"]);
export type LeadStatus = (typeof leadStatus.enumValues)[number];

export const admins = pgTable("admins", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull().default("Admin"),
  passwordHash: text().notNull(),
  createdAt: ts().notNull().defaultNow(),
  lastLoginAt: ts(),
});

/** A browser, identified by a random id kept in localStorage. */
export const visitors = pgTable(
  "visitors",
  {
    id: text().primaryKey(),
    firstSeenAt: ts().notNull().defaultNow(),
    lastSeenAt: ts().notNull().defaultNow(),
    visits: integer().notNull().default(1),
    pageviews: integer().notNull().default(0),
    country: text(),
    city: text(),
    device: text(),
    browser: text(),
    os: text(),
    language: text(),
    leadId: uuid(),
  },
  (t) => [index().on(t.lastSeenAt)],
);

/** One visit: ends after 30 minutes of inactivity (decided on the client). */
export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey(),
    visitorId: text()
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    startedAt: ts().notNull().defaultNow(),
    lastSeenAt: ts().notNull().defaultNow(),
    /** active seconds on page, reported by heartbeat */
    duration: integer().notNull().default(0),
    pageviews: integer().notNull().default(0),
    events: integer().notNull().default(0),
    /** 0..100 */
    maxScroll: integer().notNull().default(0),
    referrer: text(),
    referrerHost: text(),
    /** direct | instagram | google | yandex | telegram | whatsapp | facebook | tiktok | youtube | linkedin | referral | <utm_source> */
    channel: text().notNull().default("direct"),
    utmSource: text(),
    utmMedium: text(),
    utmCampaign: text(),
    utmContent: text(),
    utmTerm: text(),
    landingPath: text(),
    locale: text(),
    country: text(),
    city: text(),
    device: text(),
    browser: text(),
    os: text(),
    screen: text(),
    ipHash: text(),
    converted: boolean().notNull().default(false),
  },
  (t) => [index().on(t.startedAt), index().on(t.lastSeenAt), index().on(t.visitorId), index().on(t.channel)],
);

/**
 * type: pageview | section | click | scroll | form_start | form_submit | video | locale
 * name: section id / cta id / scroll milestone etc.
 */
export const events = pgTable(
  "events",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    sessionId: text()
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    visitorId: text().notNull(),
    type: text().notNull(),
    name: text(),
    path: text(),
    data: jsonb().$type<Record<string, unknown>>(),
    createdAt: ts().notNull().defaultNow(),
  },
  (t) => [index().on(t.sessionId), index().on(t.createdAt), index().on(t.type, t.name)],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** human-friendly #number */
    number: serial().notNull(),
    name: text().notNull(),
    phone: text(),
    email: text(),
    telegram: text(),
    company: text(),
    services: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    budget: text(),
    timeline: text(),
    message: text(),
    status: leadStatus().notNull().default("new"),
    locale: text(),
    visitorId: text(),
    sessionId: text(),
    channel: text(),
    utm: jsonb().$type<Record<string, string>>(),
    page: text(),
    country: text(),
    city: text(),
    device: text(),
    userAgent: text(),
    ipHash: text(),
    createdAt: ts().notNull().defaultNow(),
    updatedAt: ts().notNull().defaultNow(),
  },
  (t) => [index().on(t.createdAt), index().on(t.status)],
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    leadId: uuid()
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    authorId: uuid().references(() => admins.id, { onDelete: "set null" }),
    /** note | status */
    kind: text().notNull().default("note"),
    body: text().notNull(),
    createdAt: ts().notNull().defaultNow(),
  },
  (t) => [index().on(t.leadId)],
);

/** Key/value settings editable from the admin panel (e.g. Telegram bot). */
export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().$type<unknown>(),
  updatedAt: ts().notNull().defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Visitor = typeof visitors.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type LeadNote = typeof leadNotes.$inferSelect;
