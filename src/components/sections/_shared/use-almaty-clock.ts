"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/lib/site";

/*
 * One shared, second-aligned ticker for every clock on the page (contact + footer).
 * Snapshot is a primitive string so React can compare it cheaply.
 */

const SERVER_SNAPSHOT = "--:--:--|UTC+5";

let cached = "";
let timer: ReturnType<typeof setTimeout> | undefined;
let timeFormat: Intl.DateTimeFormat | undefined;
let offsetFormat: Intl.DateTimeFormat | undefined;
const listeners = new Set<() => void>();

function compute() {
  const now = new Date();
  timeFormat ??= new Intl.DateTimeFormat("en-GB", {
    timeZone: site.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let offset = "UTC+5";
  try {
    offsetFormat ??= new Intl.DateTimeFormat("en-US", { timeZone: site.timezone, timeZoneName: "shortOffset" });
    const part = offsetFormat.formatToParts(now).find((p) => p.type === "timeZoneName")?.value;
    if (part) offset = part.replace("GMT", "UTC");
  } catch {
    /* older engines without shortOffset */
  }
  return `${timeFormat.format(now)}|${offset}`;
}

function schedule() {
  timer = setTimeout(() => {
    cached = compute();
    listeners.forEach((l) => l());
    schedule();
  }, 1000 - (Date.now() % 1000) + 8);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    cached = compute();
    schedule();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  if (!cached) cached = compute();
  return cached;
}

const getServerSnapshot = () => SERVER_SNAPSHOT;

/** Live Almaty time `{ time: "14:05:09", offset: "UTC+5" }`; placeholder during SSR. */
export function useAlmatyClock() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [time = "--:--:--", offset = "UTC+5"] = snapshot.split("|");
  return { time, offset };
}
