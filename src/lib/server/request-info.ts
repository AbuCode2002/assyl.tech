import "server-only";
import { createHash } from "node:crypto";
import { isbot } from "isbot";
import UAParser from "ua-parser-js";

export type ClientInfo = {
  ip: string | null;
  ipHash: string | null;
  userAgent: string;
  isBot: boolean;
  device: "desktop" | "mobile" | "tablet";
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
};

export function getClientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? null;
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.ANALYTICS_SALT ?? process.env.AUTH_SECRET ?? "assyl";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function isPrivateIp(ip: string) {
  return (
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    ip.startsWith("::ffff:127.")
  );
}

/** Geo from CDN / reverse-proxy headers first, then the bundled offline GeoIP database. */
async function lookupGeo(h: Headers, ip: string | null): Promise<{ country: string | null; city: string | null }> {
  const headerCountry = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? h.get("x-country-code");
  const headerCity = h.get("x-vercel-ip-city") ?? h.get("cf-ipcity") ?? h.get("x-city");
  if (headerCountry && headerCountry !== "XX") {
    return { country: headerCountry.toUpperCase(), city: headerCity ? decodeURIComponent(headerCity) : null };
  }
  if (!ip || isPrivateIp(ip)) return { country: null, city: null };
  try {
    const geoip = (await import("fast-geoip")).default;
    const res = await geoip.lookup(ip.replace(/^::ffff:/, ""));
    return { country: res?.country || null, city: res?.city || null };
  } catch {
    return { country: null, city: null };
  }
}

export async function getClientInfo(h: Headers): Promise<ClientInfo> {
  const userAgent = h.get("user-agent") ?? "";
  const ip = getClientIp(h);
  const ua = new UAParser(userAgent).getResult();
  const type = ua.device.type;
  const device = type === "mobile" ? "mobile" : type === "tablet" ? "tablet" : "desktop";
  const geo = await lookupGeo(h, ip);
  return {
    ip,
    ipHash: hashIp(ip),
    userAgent: userAgent.slice(0, 400),
    isBot: !userAgent || isbot(userAgent),
    device,
    browser: ua.browser.name ?? null,
    os: ua.os.name ?? null,
    ...geo,
  };
}

const CHANNELS: [RegExp, string][] = [
  [/(^|\.)instagram\.com$|^l\.instagram\.com$/, "instagram"],
  [/(^|\.)facebook\.com$|^fb\.me$|^l\.facebook\.com$/, "facebook"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)yandex\.[a-z.]+$|(^|\.)ya\.ru$/, "yandex"],
  [/(^|\.)t\.me$|telegram\.org$/, "telegram"],
  [/(^|\.)wa\.me$|whatsapp\.com$/, "whatsapp"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)youtube\.com$|youtu\.be$/, "youtube"],
  [/(^|\.)linkedin\.com$|lnkd\.in$/, "linkedin"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)2gis\.[a-z]+$/, "2gis"],
];

const UTM_ALIASES: Record<string, string> = { ig: "instagram", insta: "instagram", fb: "facebook", tg: "telegram", wa: "whatsapp" };

export function classifyChannel(referrerHost: string | null, utmSource: string | null, ownHost: string | null): string {
  if (utmSource) {
    const s = utmSource.toLowerCase().trim();
    return UTM_ALIASES[s] ?? s.slice(0, 40);
  }
  if (!referrerHost || (ownHost && referrerHost === ownHost)) return "direct";
  for (const [re, name] of CHANNELS) if (re.test(referrerHost)) return name;
  return "referral";
}
