import type { BUDGET_IDS, SERVICE_IDS, TIMELINE_IDS } from "@/lib/lead-schema";

/**
 * Client-side copies of the lead option ids. Imported as *types* from the zod schema so the
 * client bundle does not pull in zod; the assertions below break `tsc` if they drift apart.
 */
export type ServiceId = (typeof SERVICE_IDS)[number];
export type BudgetId = (typeof BUDGET_IDS)[number];
export type TimelineId = (typeof TIMELINE_IDS)[number];

export const SERVICE_OPTIONS = [
  "mobile",
  "web",
  "platform",
  "ai",
  "dashboard",
  "automation",
  "design",
  "other",
] as const satisfies readonly ServiceId[];
export const BUDGET_OPTIONS = ["lt1m", "1to3m", "3to7m", "gt7m", "unknown"] as const satisfies readonly BudgetId[];
export const TIMELINE_OPTIONS = ["asap", "1to3", "3to6", "flex"] as const satisfies readonly TimelineId[];

/** The six disciplines shown in the Services accordion. */
export const SERVICE_ROWS = ["mobile", "web", "platform", "ai", "dashboard", "automation"] as const satisfies readonly ServiceId[];
export type ServiceRowId = (typeof SERVICE_ROWS)[number];

type AssertNever<T extends never> = T;
export type ServiceOptionsInSync = AssertNever<Exclude<ServiceId, (typeof SERVICE_OPTIONS)[number]>>;
export type BudgetOptionsInSync = AssertNever<Exclude<BudgetId, (typeof BUDGET_OPTIONS)[number]>>;
export type TimelineOptionsInSync = AssertNever<Exclude<TimelineId, (typeof TIMELINE_OPTIONS)[number]>>;

export const isServiceId = (value: unknown): value is ServiceId =>
  typeof value === "string" && (SERVICE_OPTIONS as readonly string[]).includes(value);

export const pad2 = (n: number) => String(n).padStart(2, "0");
