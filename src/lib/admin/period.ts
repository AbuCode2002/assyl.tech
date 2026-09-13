export const TZ = "Asia/Almaty";

export const PERIODS = [
  { id: "today", label: "Сегодня", short: "Сегодня", days: 1 },
  { id: "7d", label: "7 дней", short: "7д", days: 7 },
  { id: "30d", label: "30 дней", short: "30д", days: 30 },
  { id: "90d", label: "90 дней", short: "90д", days: 90 },
] as const;

export type PeriodId = (typeof PERIODS)[number]["id"];

export type DateRange = {
  id: PeriodId;
  label: string;
  days: number;
  /** inclusive */
  start: Date;
  /** exclusive */
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  granularity: "hour" | "day";
};

const DAY_MS = 86_400_000;

export function parsePeriod(value: string | string[] | undefined, fallback: PeriodId = "7d"): PeriodId {
  const v = Array.isArray(value) ? value[0] : value;
  return PERIODS.some((p) => p.id === v) ? (v as PeriodId) : fallback;
}

/** Offset of the Almaty zone from UTC in minutes at the given instant. */
function tzOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" }).formatToParts(date);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+05:00";
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  if (!m) return 300;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Start of the Almaty calendar day that contains `date`. */
export function startOfAlmatyDay(date: Date): Date {
  const offset = tzOffsetMinutes(date) * 60_000;
  const local = date.getTime() + offset;
  const midnightLocal = Math.floor(local / DAY_MS) * DAY_MS;
  return new Date(midnightLocal - offset);
}

export function getRange(id: PeriodId, now: Date = new Date()): DateRange {
  const period = PERIODS.find((p) => p.id === id) ?? PERIODS[1];
  const todayStart = startOfAlmatyDay(now);
  const start = new Date(todayStart.getTime() - (period.days - 1) * DAY_MS);
  const end = now;
  const shift = period.days * DAY_MS;
  return {
    id: period.id,
    label: period.label,
    days: period.days,
    start,
    end,
    prevStart: new Date(start.getTime() - shift),
    prevEnd: new Date(end.getTime() - shift),
    granularity: period.days === 1 ? "hour" : "day",
  };
}

/** Human description of the comparison period, used under KPI deltas. */
export function previousLabel(id: PeriodId): string {
  switch (id) {
    case "today":
      return "vs вчера";
    case "7d":
      return "vs пред. 7 дней";
    case "30d":
      return "vs пред. 30 дней";
    case "90d":
      return "vs пред. 90 дней";
  }
}
