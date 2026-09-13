"use client";

/**
 * First-party analytics client. No cookies: a random visitor id lives in
 * localStorage and a session id in sessionStorage (rotated after 30 min idle).
 */

type TrackType = "pageview" | "ping" | "section" | "click" | "scroll" | "form_start" | "video" | "locale";

const VISITOR_KEY = "at_vid";
const SESSION_KEY = "at_sid";
const SESSION_TS_KEY = "at_sts";
const SESSION_IDLE_MS = 30 * 60_000;

function randomId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

function safeGet(storage: Storage | undefined, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function safeSet(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {}
}

let memoryVisitor: string | null = null;
let memorySession: string | null = null;
let activeSeconds = 0;
let maxScroll = 0;

export function getVisitorId() {
  let id = safeGet(globalThis.localStorage, VISITOR_KEY) ?? memoryVisitor;
  if (!id) {
    id = randomId();
    safeSet(globalThis.localStorage, VISITOR_KEY, id);
  }
  memoryVisitor = id;
  return id;
}

export function getSessionId() {
  const now = Date.now();
  const last = Number(safeGet(globalThis.sessionStorage, SESSION_TS_KEY) ?? 0);
  let id = safeGet(globalThis.sessionStorage, SESSION_KEY) ?? memorySession;
  if (!id || (last && now - last > SESSION_IDLE_MS)) {
    id = randomId();
    safeSet(globalThis.sessionStorage, SESSION_KEY, id);
    activeSeconds = 0;
    maxScroll = 0;
  }
  safeSet(globalThis.sessionStorage, SESSION_TS_KEY, String(now));
  memorySession = id;
  return id;
}

function locale() {
  const seg = location.pathname.split("/")[1];
  return seg === "kz" || seg === "en" ? seg : "ru";
}

function send(body: Record<string, unknown>) {
  const json = JSON.stringify(body);
  if (navigator.sendBeacon?.("/api/t", new Blob([json], { type: "text/plain" }))) return;
  fetch("/api/t", { method: "POST", body: json, keepalive: true, headers: { "content-type": "text/plain" } }).catch(
    () => {},
  );
}

export function track(type: TrackType, name?: string, data?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (navigator.webdriver) return;
  send({
    v: getVisitorId(),
    s: getSessionId(),
    t: type,
    n: name,
    p: location.pathname,
    l: locale(),
    dur: Math.round(activeSeconds),
    sd: maxScroll,
    d: data,
  });
}

let started = false;

/** Call once on the client: pageview, heartbeat, scroll depth milestones, section views. */
export function startTracking() {
  if (started || typeof window === "undefined" || navigator.webdriver) return;
  started = true;

  const params = new URLSearchParams(location.search);
  const utm = Object.fromEntries(
    ["source", "medium", "campaign", "content", "term"]
      .map((k) => [k, params.get(`utm_${k}`)] as const)
      .filter(([, v]) => v),
  );

  send({
    v: getVisitorId(),
    s: getSessionId(),
    t: "pageview",
    p: location.pathname,
    l: locale(),
    r: document.referrer || undefined,
    u: Object.keys(utm).length ? utm : undefined,
    sc: `${screen.width}x${screen.height}`,
    lang: navigator.language,
  });

  // active time — counts only while the tab is visible
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    if (document.visibilityState === "visible") activeSeconds += (now - lastTick) / 1000;
    lastTick = now;
  }, 1000);
  setInterval(() => {
    if (document.visibilityState === "visible") track("ping");
  }, 20_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") track("ping");
  });

  // scroll depth milestones
  const hit = new Set<number>();
  const onScroll = () => {
    const doc = document.documentElement;
    const depth = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100));
    if (depth > maxScroll) maxScroll = depth;
    for (const m of [25, 50, 75, 100]) {
      if (depth >= m && !hit.has(m)) {
        hit.add(m);
        track("scroll", String(m));
      }
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // section views: any element with data-track-section="id"
  const seen = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.trackSection;
        if (entry.isIntersecting && id && !seen.has(id)) {
          seen.add(id);
          track("section", id);
        }
      }
    },
    { threshold: 0.35 },
  );
  const observe = () => document.querySelectorAll("[data-track-section]").forEach((el) => io.observe(el));
  observe();
  setTimeout(observe, 2500);

  // clicks: any element with data-track-click="id"
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-track-click]");
      if (el?.dataset.trackClick) track("click", el.dataset.trackClick);
    },
    { capture: true },
  );
}
