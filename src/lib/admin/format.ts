import { TZ } from "./period";

type DateInput = Date | string | number | null | undefined;

function toDate(v: DateInput): Date | null {
  if (v === null || v === undefined) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dateTimeYearFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, day: "numeric", month: "short" });
const fullDateFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const timeSecFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const yearFmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, year: "numeric" });
const numFmt = new Intl.NumberFormat("ru-RU");

const clean = (s: string) => s.replace(/\s?г\./g, "").replace(/\./g, "");

/** "13 сент, 14:05" (year added if not the current year). */
export function formatDateTime(v: DateInput): string {
  const d = toDate(v);
  if (!d) return "—";
  const sameYear = yearFmt.format(d) === yearFmt.format(new Date());
  return clean((sameYear ? dateTimeFmt : dateTimeYearFmt).format(d));
}

export function formatFullDateTime(v: DateInput): string {
  const d = toDate(v);
  return d ? fullDateFmt.format(d) : "—";
}

export function formatDate(v: DateInput): string {
  const d = toDate(v);
  return d ? clean(dateFmt.format(d)) : "—";
}

export function formatTime(v: DateInput, seconds = false): string {
  const d = toDate(v);
  return d ? (seconds ? timeSecFmt : timeFmt).format(d) : "—";
}

/** "YYYY-MM-DD" bucket label → "13 сент". */
export function formatDayKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return clean(new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", day: "numeric", month: "short" }).format(Date.UTC(y, m - 1, d)));
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return numFmt.format(Math.round(n));
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")} млн`;
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(1).replace(".0", "")} тыс`;
  return numFmt.format(Math.round(n));
}

export function formatPercent(ratio: number | null | undefined, digits = 1): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return "—";
  const v = ratio * 100;
  return `${v.toFixed(v !== 0 && Math.abs(v) < 10 ? digits : 0).replace(".", ",")}%`;
}

/** Seconds → "2 мин 05 с" / "45 с" / "1 ч 12 мин". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "—";
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин ${String(s % 60).padStart(2, "0")} с`;
  const h = Math.floor(m / 60);
  return `${h} ч ${String(m % 60).padStart(2, "0")} мин`;
}

/** Seconds → "+1:05" relative offset for timelines. */
export function formatOffset(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `+${h}:${String(m).padStart(2, "0")}:${sec}` : `+${m}:${sec}`;
}

/** "5 мин назад", "2 ч назад", "3 дн назад" or a date. */
export function formatRelative(v: DateInput, now: Date = new Date()): string {
  const d = toDate(v);
  if (!d) return "—";
  const diff = Math.round((now.getTime() - d.getTime()) / 1000);
  if (diff < 45) return "только что";
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} мин назад`;
  if (diff < 86_400) return `${Math.round(diff / 3600)} ч назад`;
  if (diff < 7 * 86_400) return `${Math.round(diff / 86_400)} дн назад`;
  return formatDateTime(d);
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Digits only, for wa.me / tel: links. Kazakh numbers starting with 8 are normalised to 7. */
export function phoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return digits;
}

export function telegramUsername(value: string): string | null {
  const v = value.trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  return /^[a-zA-Z0-9_]{3,64}$/.test(v) ? v : null;
}
