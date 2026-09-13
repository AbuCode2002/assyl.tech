import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { DateRange } from "@/lib/admin/period";

/** Postgres timezone literal used for all calendar bucketing. */
export const ALMATY = sql.raw(`'Asia/Almaty'`);

/** Timestamp parameter, explicitly typed so both PGlite and postgres-js agree. */
export const tsParam = (d: Date) => sql`${d.toISOString()}::timestamptz`;

/** Online = heartbeat seen within the last 2 minutes. */
export const ONLINE_WINDOW_MS = 2 * 60_000;

/**
 * Runs raw SQL and returns rows regardless of driver
 * (PGlite returns `{ rows }`, postgres-js returns an array).
 */
export async function queryRows<T>(query: SQL): Promise<T[]> {
  const db = await getDb();
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] }).rows ?? []) as T[];
}

export const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** `<column> in [start, end)` — column is a trusted raw SQL identifier like `s.started_at`. */
export const inRange = (column: string, start: Date, end: Date) => {
  const col = sql.raw(column);
  return sql`${col} >= ${tsParam(start)} and ${col} < ${tsParam(end)}`;
};

export type RangeInput = Pick<DateRange, "start" | "end">;

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Timestamp (ms) after which a session's lastSeenAt counts as "online". */
export const onlineSinceMs = () => Date.now() - ONLINE_WINDOW_MS;
