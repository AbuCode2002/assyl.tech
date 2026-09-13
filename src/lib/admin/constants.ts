import type { LeadStatus } from "@/lib/db/schema";

export const LEAD_STATUSES = ["new", "in_progress", "proposal", "won", "lost", "spam"] as const satisfies readonly LeadStatus[];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  proposal: "КП отправлено",
  won: "Сделка",
  lost: "Отказ",
  spam: "Спам",
};

/** Hex colors for status UI (badges, kanban column accents). */
export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "#3b7bff",
  in_progress: "#56e1ff",
  proposal: "#9b6bff",
  won: "#3dffa8",
  lost: "#8d95a8",
  spam: "#ff5a6a",
};

/** Main pipeline shown in the status stepper. */
export const PIPELINE: LeadStatus[] = ["new", "in_progress", "proposal", "won"];

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === "string" && (LEAD_STATUSES as readonly string[]).includes(v);
}

export const SERVICE_LABELS: Record<string, string> = {
  mobile: "Мобильное приложение",
  web: "Сайт / веб",
  platform: "Платформа",
  ai: "AI-решения",
  dashboard: "Дашборд",
  automation: "Автоматизация",
  design: "Дизайн",
  other: "Другое",
};

export const CHANNEL_LABELS: Record<string, string> = {
  direct: "Прямой заход",
  instagram: "Instagram",
  google: "Google",
  yandex: "Яндекс",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  bing: "Bing",
  "2gis": "2ГИС",
  referral: "Другие сайты",
};

export function channelLabel(channel: string | null | undefined): string {
  if (!channel) return "—";
  return CHANNEL_LABELS[channel] ?? channel;
}

export const DEVICE_LABELS: Record<string, string> = {
  mobile: "Телефон",
  desktop: "Компьютер",
  tablet: "Планшет",
};

export function deviceLabel(device: string | null | undefined): string {
  if (!device) return "—";
  return DEVICE_LABELS[device] ?? device;
}

/** Landing sections in page order. */
export const SECTION_ORDER = ["hero", "about", "showcase", "works", "services", "process", "contact", "footer"] as const;

export const SECTION_LABELS: Record<string, string> = {
  hero: "Первый экран",
  about: "О студии",
  showcase: "Шоукейс",
  works: "Работы",
  services: "Услуги",
  process: "Процесс",
  contact: "Контакты / форма",
  footer: "Футер",
};

export const LOCALE_LABELS: Record<string, string> = {
  ru: "Русский",
  kz: "Қазақша",
  en: "English",
};

const CLICK_LABELS: Record<string, string> = {
  "cta-hero": "Первый экран → Обсудить проект",
  "cta-hero-works": "Первый экран → Смотреть работы",
  "nav-contact": "Меню → Контакты",
  "nav-works": "Меню → Работы",
  "nav-services": "Меню → Услуги",
  "nav-about": "Меню → О студии",
  "nav-process": "Меню → Процесс",
  "contact-instagram": "Контакты → Instagram",
  "contact-telegram": "Контакты → Telegram",
  "contact-whatsapp": "Контакты → WhatsApp",
  "contact-email": "Контакты → Email",
  "contact-phone": "Контакты → Телефон",
};

export function clickLabel(name: string | null | undefined): string {
  if (!name) return "—";
  if (CLICK_LABELS[name]) return CLICK_LABELS[name];
  if (name.startsWith("work-open-")) return `Открыл кейс «${name.slice("work-open-".length)}»`;
  return name;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  pageview: "Просмотр страницы",
  section: "Блок",
  click: "Клик",
  scroll: "Прокрутка",
  form_start: "Начал заполнять форму",
  form_submit: "Отправил заявку",
  video: "Видео",
  locale: "Смена языка",
};

export const COUNTRY_NAMES: Record<string, string> = {
  KZ: "Казахстан",
  RU: "Россия",
  UZ: "Узбекистан",
  KG: "Кыргызстан",
  US: "США",
  TR: "Турция",
  AE: "ОАЭ",
  DE: "Германия",
  GB: "Великобритания",
  CN: "Китай",
  BY: "Беларусь",
  UA: "Украина",
  GE: "Грузия",
  AM: "Армения",
  AZ: "Азербайджан",
  TJ: "Таджикистан",
  NL: "Нидерланды",
  FR: "Франция",
  PL: "Польша",
  KR: "Южная Корея",
};

export function countryName(code: string | null | undefined): string {
  if (!code) return "Неизвестно";
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

/** Flag emoji from an ISO 3166-1 alpha-2 code. */
export function flagEmoji(code: string | null | undefined): string {
  if (!code || !/^[a-z]{2}$/i.test(code)) return "🌐";
  const base = 0x1f1e6;
  const up = code.toUpperCase();
  return String.fromCodePoint(base + up.charCodeAt(0) - 65, base + up.charCodeAt(1) - 65);
}

/**
 * Chart palette — brand hues stepped into the dark-surface lightness band
 * (validated against #0a0d14: band, chroma, CVD and contrast checks pass in this order).
 */
export const CHART_COLORS = ["#3b7bff", "#28a2c4", "#9b6bff", "#1fa874", "#c28014"] as const;
