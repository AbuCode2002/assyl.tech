import "server-only";
import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { LeadStatus } from "@/lib/db/schema";
import { SECTION_ORDER, STATUS_LABELS } from "./constants";

/**
 * Demo data for local development: ~30 days of sessions/events/leads.
 * Rows are marked so they can be removed: visitor/session ids start with `demo_`, leads have ipHash = "demo".
 */

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1]![0];
}

const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!;
const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const intBetween = (rng: Rng, min: number, max: number) => Math.floor(between(rng, min, max + 1));
const chance = (rng: Rng, p: number) => rng() < p;

function demoId(rng: Rng): string {
  let s = "demo_";
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 14; i++) s += alphabet[Math.floor(rng() * alphabet.length)];
  return s;
}

const CHANNELS = [
  ["instagram", 34],
  ["direct", 22],
  ["google", 16],
  ["telegram", 10],
  ["whatsapp", 7],
  ["referral", 5],
  ["yandex", 3],
  ["facebook", 2],
  ["tiktok", 1],
] as const;

const REFERRERS: Record<string, string[]> = {
  instagram: ["l.instagram.com", "instagram.com"],
  google: ["google.com", "google.kz"],
  telegram: ["t.me"],
  whatsapp: ["wa.me"],
  yandex: ["yandex.kz", "ya.ru"],
  facebook: ["l.facebook.com"],
  tiktok: ["tiktok.com"],
  referral: ["vc.ru", "habr.com", "behance.net", "dribbble.com", "2gis.kz", "startup.kz"],
};

const UTM_PRESETS: Record<string, { medium: string; campaign: string; weight: number }[]> = {
  instagram: [
    { medium: "bio", campaign: "bio_link", weight: 3 },
    { medium: "stories", campaign: "autumn_cases", weight: 2 },
    { medium: "cpc", campaign: "ig_leads_almaty", weight: 2 },
  ],
  google: [
    { medium: "cpc", campaign: "brand_search", weight: 2 },
    { medium: "cpc", campaign: "mobile_apps_kz", weight: 2 },
  ],
  telegram: [{ medium: "post", campaign: "tg_channel", weight: 1 }],
};

const GEO = [
  ["KZ", "Алматы", 40],
  ["KZ", "Астана", 20],
  ["KZ", "Шымкент", 8],
  ["KZ", "Караганда", 6],
  ["KZ", "Актобе", 3],
  ["KZ", "Атырау", 2.5],
  ["KZ", "Павлодар", 2],
  ["KZ", "Усть-Каменогорск", 1.5],
  ["RU", "Москва", 5],
  ["RU", "Санкт-Петербург", 2],
  ["RU", "Новосибирск", 1],
  ["UZ", "Ташкент", 4],
  ["KG", "Бишкек", 1.5],
  ["US", "Нью-Йорк", 1.2],
  ["US", "Сан-Франциско", 0.8],
  ["AE", "Дубай", 1],
  ["TR", "Стамбул", 0.5],
] as const;

const HOUR_WEIGHTS = [0.3, 0.15, 0.1, 0.08, 0.08, 0.1, 0.25, 0.5, 0.8, 1.1, 1.3, 1.4, 1.3, 1.3, 1.4, 1.3, 1.2, 1.1, 1.1, 1.3, 1.5, 1.6, 1.3, 0.8];

const SECTION_SCROLL: Record<string, number> = {
  hero: 0,
  about: 13,
  showcase: 27,
  works: 46,
  services: 60,
  process: 74,
  contact: 89,
  footer: 100,
};

const CONTINUE: Record<string, number> = {
  hero: 0.74,
  about: 0.82,
  showcase: 0.83,
  works: 0.78,
  services: 0.8,
  process: 0.82,
  contact: 0.72,
};

const WORKS = ["krovla", "qazaqfood", "medlab", "dala-agro", "logistix"];

const FIRST_NAMES_M = ["Айдос", "Данияр", "Ерлан", "Нурсултан", "Руслан", "Тимур", "Арман", "Бауыржан", "Олжас", "Азамат", "Ильяс", "Санжар", "Нуржан", "Ержан", "Максим", "Дмитрий", "Сергей", "Алексей", "Шерзод"];
const FIRST_NAMES_F = ["Алия", "Мадина", "Асель", "Дина", "Камила", "Жанна", "Сауле", "Айгерим", "Гульнара", "Диана", "Томирис", "Акмарал", "Меруерт", "Екатерина", "Анна", "Виктория", "Ольга"];
const LAST_NAMES = [
  ["Сейткали", "Сейткали"],
  ["Нурланов", "Нурланова"],
  ["Ахметов", "Ахметова"],
  ["Жумабаев", "Жумабаева"],
  ["Касымов", "Касымова"],
  ["Тулегенов", "Тулегенова"],
  ["Абенов", "Абенова"],
  ["Омаров", "Омарова"],
  ["Ибраев", "Ибраева"],
  ["Садыков", "Садыкова"],
  ["Сулейменов", "Сулейменова"],
  ["Есенов", "Есенова"],
  ["Нургалиев", "Нургалиева"],
  ["Смагулов", "Смагулова"],
  ["Ли", "Ли"],
  ["Ким", "Ким"],
  ["Пак", "Пак"],
  ["Ковалёв", "Ковалёва"],
  ["Смирнов", "Смирнова"],
  ["Байжанов", "Байжанова"],
  ["Аубакиров", "Аубакирова"],
] as const;

const COMPANIES = [
  "ТОО «Алем Строй»",
  "Nomad Coffee",
  "ТОО «Dala Agro»",
  "Steppe Fitness",
  "Medi Clinic Astana",
  "ИП Касымов",
  "Tengri Realty",
  "EduHub KZ",
  "Shymkent Auto",
  "Silk Road Travel",
  "Qazaq Logistics",
  "Beauty Lab Almaty",
];

const MESSAGES = [
  "Нужно мобильное приложение для доставки еды: каталог, корзина, оплата картой, личный кабинет курьера.",
  "Хотим переделать сайт компании, текущий устарел и плохо работает на телефонах. Нужна интеграция с CRM.",
  "Ищем команду для разработки MVP маркетплейса услуг. Есть прототип в Figma.",
  "Нужен дашборд для руководства: продажи из 1С, склад, выручка по филиалам в реальном времени.",
  "Интересует чат-бот с AI для ответов клиентам в WhatsApp и Instagram.",
  "Автоматизация заявок: сейчас всё в Excel и WhatsApp, хотим единую систему для менеджеров.",
  "Запускаем онлайн-школу, нужна платформа с курсами, оплатой и личным кабинетом ученика.",
  "Нужен редизайн приложения и доработка бэкенда, текущий подрядчик пропал.",
  "Хотим лендинг под новый жилой комплекс с 3D-планировками и формой бронирования.",
  "Нужна CRM для клиники: запись пациентов, напоминания в Telegram, отчёты.",
  "Подскажите сроки и стоимость разработки приложения для фитнес-клуба (iOS + Android).",
  "",
];

const NOTE_TEXTS = [
  "Созвонились, клиент хочет MVP за 2 месяца. Договорились прислать КП до пятницы.",
  "Отправил презентацию и кейсы. Ждём обратную связь от директора.",
  "Встреча в офисе клиента в четверг в 15:00.",
  "Бюджет ниже ожидаемого, предложили урезанный первый этап.",
  "Клиент сравнивает с двумя другими студиями, важна скорость запуска.",
  "Подписали договор, предоплата 50% получена.",
  "Не выходит на связь третий день, написал в WhatsApp.",
  "Уточнили ТЗ: нужна интеграция с Kaspi и 1С.",
];

const SERVICES = [
  ["mobile", 30],
  ["web", 28],
  ["platform", 12],
  ["ai", 10],
  ["dashboard", 8],
  ["automation", 9],
  ["design", 10],
  ["other", 3],
] as const;

const BUDGETS = ["до 1 млн ₸", "1–3 млн ₸", "3–7 млн ₸", "7+ млн ₸", "не определён"];
const TIMELINES = ["срочно", "1–3 месяца", "3–6 месяцев", "гибко"];

const MOBILE_UA = [
  { browser: "Mobile Safari", os: "iOS", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1", w: 38 },
  { browser: "Chrome", os: "Android", ua: "Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36", w: 34 },
  { browser: "Instagram", os: "iOS", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.0", w: 20 },
  { browser: "Samsung Browser", os: "Android", ua: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36", w: 8 },
] as const;
const DESKTOP_UA = [
  { browser: "Chrome", os: "Windows", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", w: 46 },
  { browser: "Chrome", os: "Mac OS", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", w: 22 },
  { browser: "Safari", os: "Mac OS", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15", w: 14 },
  { browser: "Edge", os: "Windows", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0", w: 10 },
  { browser: "Yandex", os: "Windows", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 YaBrowser/25.6.0.0 Safari/537.36", w: 8 },
] as const;

type SessionRow = typeof schema.sessions.$inferInsert & { id: string; startedAt: Date; lastSeenAt: Date };
type EventRowInsert = typeof schema.events.$inferInsert;
type LeadRowInsert = typeof schema.leads.$inferInsert & { id: string; createdAt: Date };

async function insertChunks<T>(rows: T[], size: number, insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

export type DemoResult = { visitors: number; sessions: number; events: number; leads: number };

export async function removeDemoData(): Promise<void> {
  const db = await getDb();
  await db.delete(schema.leads).where(eq(schema.leads.ipHash, "demo"));
  // sessions and events cascade from visitors
  await db.delete(schema.visitors).where(like(schema.visitors.id, "demo\\_%"));
}

export async function generateDemoData(authorId: string | null): Promise<DemoResult> {
  const rng = mulberry32(Date.now() % 2_147_483_647);
  const now = Date.now();
  const DAY = 86_400_000;
  const ALMATY_OFFSET = 5 * 3_600_000;

  await removeDemoData();

  // ---- time sampling (Almaty local day/hour → UTC instant) ----
  const todayLocalMidnight = Math.floor((now + ALMATY_OFFSET) / DAY) * DAY; // local-epoch ms
  const dayWeights = Array.from({ length: 30 }, (_, back) => {
    const localDay = todayLocalMidnight - back * DAY;
    const weekday = new Date(localDay).getUTCDay(); // 0 = Sunday
    const weekend = weekday === 0 || weekday === 6 ? 0.72 : 1;
    const growth = 0.75 + ((29 - back) / 29) * 0.5;
    return [back, weekend * growth] as const;
  });
  const sampleStart = (): number => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const back = weighted(rng, dayWeights);
      const hour = weighted(rng, HOUR_WEIGHTS.map((w, h) => [h, w] as const));
      const localTs = todayLocalMidnight - back * DAY + hour * 3_600_000 + Math.floor(rng() * 3_600_000);
      const utc = localTs - ALMATY_OFFSET;
      if (utc < now - 5 * 60_000) return utc;
    }
    return now - intBetween(rng, 10, 600) * 60_000;
  };

  const visitors: (typeof schema.visitors.$inferInsert & { id: string })[] = [];
  const sessions: SessionRow[] = [];
  const events: EventRowInsert[] = [];
  const pendingLeads: { session: SessionRow; submitAt: Date; ua: string }[] = [];
  const submitEvents = new Map<string, EventRowInsert>();

  const VISITOR_COUNT = 1100;

  for (let v = 0; v < VISITOR_COUNT; v++) {
    const visitorId = demoId(rng);
    const [country, city] = weighted(rng, GEO.map(([c, ci, w]) => [[c, ci] as const, w] as const));
    const device = weighted(rng, [
      ["mobile", 65],
      ["desktop", 31],
      ["tablet", 4],
    ] as const);
    const uaInfo =
      device === "desktop"
        ? weighted(rng, DESKTOP_UA.map((u) => [u, u.w] as const))
        : weighted(rng, MOBILE_UA.map((u) => [u, u.w] as const));
    const locale = weighted(rng, [
      ["ru", 78],
      ["kz", 12],
      ["en", 10],
    ] as const);
    const language = locale === "kz" ? "kk-KZ" : locale === "en" ? "en-US" : country === "KZ" ? "ru-KZ" : "ru-RU";
    const screen =
      device === "desktop"
        ? pick(rng, ["1920x1080", "1440x900", "1536x864", "2560x1440", "1366x768"])
        : device === "tablet"
          ? pick(rng, ["820x1180", "768x1024"])
          : pick(rng, ["390x844", "393x873", "412x915", "375x812", "430x932"]);

    const sessionCount = weighted(rng, [
      [1, 76],
      [2, 14],
      [3, 6],
      [4, 4],
    ] as const);
    const starts = Array.from({ length: sessionCount }, sampleStart).sort((a, b) => a - b);

    let pageviews = 0;
    const visitorSessions: SessionRow[] = [];

    starts.forEach((startTs, idx) => {
      const sessionId = demoId(rng);
      const channel = idx > 0 && chance(rng, 0.45) ? "direct" : weighted(rng, CHANNELS);
      const referrerHost = REFERRERS[channel] ? pick(rng, REFERRERS[channel]!) : null;
      const utmPreset = UTM_PRESETS[channel] && chance(rng, 0.45) ? weighted(rng, UTM_PRESETS[channel]!.map((p) => [p, p.weight] as const)) : null;
      const landingPath = locale === "ru" ? "/" : `/${locale}`;

      // ---- event sequence along the landing ----
      const seq: EventRowInsert[] = [];
      let t = startTs;
      const push = (type: string, name: string | null, data?: Record<string, unknown>) => {
        seq.push({ sessionId, visitorId, type, name, path: landingPath, data: data ?? null, createdAt: new Date(t) });
      };
      push("pageview", null);
      t += intBetween(rng, 400, 1500);

      const quality = (channel === "google" || channel === "referral" ? 1.08 : channel === "instagram" ? 0.95 : 1) * (device === "desktop" ? 1.05 : 1);
      let maxScroll = 0;
      const emittedScroll = new Set<number>();
      let reachedContact = false;

      let submitted = false;

      for (const section of SECTION_ORDER) {
        push("section", section);
        const depth = SECTION_SCROLL[section]!;
        for (const milestone of [25, 50, 75, 100]) {
          if (depth >= milestone - 3 && !emittedScroll.has(milestone)) {
            emittedScroll.add(milestone);
            t += intBetween(rng, 300, 1800);
            push("scroll", String(milestone));
          }
        }
        maxScroll = Math.max(maxScroll, Math.min(100, depth + intBetween(rng, 0, 8)));

        if (section === "hero") {
          if (chance(rng, 0.11)) {
            t += intBetween(rng, 2000, 6000);
            push("click", "cta-hero");
          } else if (chance(rng, 0.09)) {
            t += intBetween(rng, 2000, 6000);
            push("click", "cta-hero-works");
          }
          if (chance(rng, 0.03)) {
            t += intBetween(rng, 1000, 4000);
            push("locale", pick(rng, ["ru", "kz", "en"]));
          }
        }
        if (section === "showcase" && chance(rng, 0.16)) {
          t += intBetween(rng, 1500, 5000);
          push("video", "play");
        }
        if (section === "works") {
          t += intBetween(rng, 6000, 30_000);
          if (chance(rng, 0.28)) push("click", `work-open-${pick(rng, WORKS)}`);
          if (chance(rng, 0.08)) {
            t += intBetween(rng, 3000, 15_000);
            push("click", `work-open-${pick(rng, WORKS)}`);
          }
        }
        if (section === "contact") {
          reachedContact = true;
          if (chance(rng, 0.06)) push("click", "contact-instagram");
          if (chance(rng, 0.05)) push("click", "contact-telegram");
          if (chance(rng, 0.06)) push("click", "contact-whatsapp");
          if (chance(rng, 0.23)) {
            t += intBetween(rng, 2000, 8000);
            push("form_start", null);

            if (chance(rng, 0.44)) {
              t += intBetween(rng, 25_000, 140_000);
              submitted = true;
              push("form_submit", "lead");
            }
          }
        }
        if (section === "footer") break;

        t += intBetween(rng, 3000, section === "works" ? 12_000 : 20_000);
        if (!chance(rng, Math.min(0.97, (CONTINUE[section] ?? 0.8) * quality))) break;
      }
      if (chance(rng, 0.04) && !reachedContact) {
        t += intBetween(rng, 1000, 4000);
        push("click", "nav-contact");
      }

      const tail = intBetween(rng, 4000, 45_000);
      const lastSeen = Math.min(now - 3 * 60_000, t + tail);
      const duration = Math.max(3, Math.round((lastSeen - startTs) / 1000 * between(rng, 0.75, 0.95)));

      const session: SessionRow = {
        id: sessionId,
        visitorId,
        startedAt: new Date(startTs),
        lastSeenAt: new Date(Math.max(startTs + 3000, lastSeen)),
        duration,
        pageviews: 1,
        events: seq.length,
        maxScroll,
        referrer: referrerHost ? `https://${referrerHost}/` : null,
        referrerHost,
        channel,
        utmSource: utmPreset ? channel : null,
        utmMedium: utmPreset?.medium ?? null,
        utmCampaign: utmPreset?.campaign ?? null,
        landingPath,
        locale,
        country,
        city,
        device,
        browser: uaInfo.browser,
        os: uaInfo.os,
        screen,
        ipHash: "demo",
        converted: submitted,
      };
      pageviews += 1;
      visitorSessions.push(session);
      sessions.push(session);
      events.push(...seq);
      if (submitted) {
        const submitEvent = seq.find((e) => e.type === "form_submit")!;
        submitEvents.set(sessionId, submitEvent);
        pendingLeads.push({ session, submitAt: submitEvent.createdAt as Date, ua: uaInfo.ua });
      }
    });

    visitors.push({
      id: visitorId,
      firstSeenAt: visitorSessions[0]!.startedAt,
      lastSeenAt: visitorSessions[visitorSessions.length - 1]!.lastSeenAt,
      visits: sessionCount,
      pageviews,
      country,
      city,
      device,
      browser: uaInfo.browser,
      os: uaInfo.os,
      language,
    });
  }

  // ---- a few visitors on the site right now (single-visit, non-converted sessions) ----
  const onlineCandidates = sessions.filter((s) => !s.converted && visitors.find((v) => v.id === s.visitorId)?.visits === 1).slice(-4);
  for (const s of onlineCandidates) {
    const startTs = now - intBetween(rng, 40, 420) * 1000;
    const shift = startTs - s.startedAt.getTime();
    s.startedAt = new Date(startTs);
    s.lastSeenAt = new Date(now - intBetween(rng, 5, 50) * 1000);
    s.duration = Math.max(5, Math.round((s.lastSeenAt.getTime() - startTs) / 1000));
    for (const e of events) {
      if (e.sessionId === s.id) {
        const ts = (e.createdAt as Date).getTime() + shift;
        e.createdAt = new Date(Math.min(ts, s.lastSeenAt.getTime()));
      }
    }
    const visitor = visitors.find((v) => v.id === s.visitorId);
    if (visitor) {
      visitor.firstSeenAt = s.startedAt;
      visitor.lastSeenAt = s.lastSeenAt;
    }
  }

  // ---- keep ~35 leads ----
  pendingLeads.sort((a, b) => a.submitAt.getTime() - b.submitAt.getTime());
  const MAX_LEADS = 38;
  while (pendingLeads.length > MAX_LEADS) {
    const drop = pendingLeads.splice(Math.floor(rng() * pendingLeads.length), 1)[0]!;
    drop.session.converted = false;
    const ev = submitEvents.get(drop.session.id);
    if (ev) {
      const idx = events.indexOf(ev);
      if (idx >= 0) events.splice(idx, 1);
      drop.session.events = Math.max(0, (drop.session.events ?? 1) - 1);
    }
    submitEvents.delete(drop.session.id);
  }

  const leads: LeadRowInsert[] = pendingLeads.map(({ session, submitAt, ua }) => {
    const female = chance(rng, 0.45);
    const [lastM, lastF] = pick(rng, LAST_NAMES);
    const name = `${pick(rng, female ? FIRST_NAMES_F : FIRST_NAMES_M)} ${female ? lastF : lastM}`;
    const serviceCount = weighted(rng, [
      [1, 55],
      [2, 32],
      [3, 13],
    ] as const);
    const services = new Set<string>();
    while (services.size < serviceCount) services.add(weighted(rng, SERVICES));
    const ageDays = (now - submitAt.getTime()) / DAY;
    const status: LeadStatus =
      ageDays < 2
        ? weighted(rng, [
            ["new", 75],
            ["in_progress", 25],
          ] as const)
        : ageDays < 8
          ? weighted(rng, [
              ["new", 15],
              ["in_progress", 45],
              ["proposal", 30],
              ["spam", 5],
              ["lost", 5],
            ] as const)
          : weighted(rng, [
              ["in_progress", 15],
              ["proposal", 25],
              ["won", 30],
              ["lost", 22],
              ["spam", 8],
            ] as const);
    const phoneDigits = `7${pick(rng, ["701", "702", "705", "707", "708", "747", "771", "775", "777", "778"])}${String(intBetween(rng, 1_000_000, 9_999_999))}`;
    const phone = `+${phoneDigits[0]} ${phoneDigits.slice(1, 4)} ${phoneDigits.slice(4, 7)} ${phoneDigits.slice(7, 9)} ${phoneDigits.slice(9, 11)}`;
    const latin = `user${intBetween(rng, 10, 999)}`;
    const utm = session.utmSource
      ? Object.fromEntries(
          Object.entries({ source: session.utmSource, medium: session.utmMedium, campaign: session.utmCampaign }).filter(([, v]) => v),
        )
      : null;
    const message = pick(rng, MESSAGES);
    return {
      id: randomUUID(),
      name,
      phone: chance(rng, 0.9) ? phone : null,
      email: chance(rng, 0.45) ? `${latin}@${pick(rng, ["gmail.com", "mail.ru", "inbox.kz", "yandex.kz"])}` : null,
      telegram: chance(rng, 0.35) ? `@${latin}_${pick(rng, ["kz", "dev", "biz", "pro"])}` : null,
      company: chance(rng, 0.5) ? pick(rng, COMPANIES) : null,
      services: [...services],
      budget: chance(rng, 0.85) ? pick(rng, BUDGETS) : null,
      timeline: chance(rng, 0.8) ? pick(rng, TIMELINES) : null,
      message: message || null,
      status,
      locale: session.locale,
      visitorId: session.visitorId,
      sessionId: session.id,
      channel: session.channel,
      utm: utm as Record<string, string> | null,
      page: session.landingPath,
      country: session.country,
      city: session.city,
      device: session.device,
      userAgent: ua,
      ipHash: "demo",
      createdAt: submitAt,
      updatedAt: submitAt,
    };
  });

  const db = await getDb();

  await insertChunks(visitors, 500, (chunk) => db.insert(schema.visitors).values(chunk));
  await insertChunks(sessions, 400, (chunk) => db.insert(schema.sessions).values(chunk));

  const inserted = leads.length
    ? await db.insert(schema.leads).values(leads).returning({ id: schema.leads.id, number: schema.leads.number, sessionId: schema.leads.sessionId })
    : [];
  for (const row of inserted) {
    const ev = row.sessionId ? submitEvents.get(row.sessionId) : undefined;
    if (ev) ev.data = { leadId: row.id, number: row.number };
  }
  await insertChunks(events, 1000, (chunk) => db.insert(schema.events).values(chunk));

  for (const lead of leads) {
    await db.update(schema.visitors).set({ leadId: lead.id }).where(eq(schema.visitors.id, lead.visitorId!));
  }

  // ---- notes: status history + a few comments ----
  const notes: (typeof schema.leadNotes.$inferInsert)[] = [];
  const path: LeadStatus[] = ["new", "in_progress", "proposal", "won"];
  for (const lead of leads) {
    const status = lead.status as LeadStatus;
    let at = lead.createdAt.getTime();
    const step = () => {
      at = Math.min(now - 60_000, at + intBetween(rng, 2, 40) * 3_600_000);
      return new Date(at);
    };
    const chain: LeadStatus[] =
      status === "new"
        ? []
        : status === "lost" || status === "spam"
          ? status === "spam"
            ? ["new", "spam"]
            : ["new", "in_progress", ...(chance(rng, 0.5) ? (["proposal"] as LeadStatus[]) : []), "lost"]
          : path.slice(0, path.indexOf(status) + 1);
    for (let i = 1; i < chain.length; i++) {
      const createdAt = step();
      notes.push({
        leadId: lead.id,
        authorId,
        kind: "status",
        body: `Статус: ${STATUS_LABELS[chain[i - 1]!]} → ${STATUS_LABELS[chain[i]!]}`,
        createdAt,
      });
      if (chain[i] !== "spam" && chance(rng, 0.45)) {
        notes.push({ leadId: lead.id, authorId, kind: "note", body: pick(rng, NOTE_TEXTS), createdAt: new Date(createdAt.getTime() + 60_000) });
      }
    }
    if (chain.length > 1) {
      await db.update(schema.leads).set({ updatedAt: new Date(at) }).where(eq(schema.leads.id, lead.id));
    }
  }
  await insertChunks(notes, 500, (chunk) => db.insert(schema.leadNotes).values(chunk));

  return { visitors: visitors.length, sessions: sessions.length, events: events.length, leads: leads.length };
}
