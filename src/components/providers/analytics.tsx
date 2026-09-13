"use client";

import { useEffect } from "react";
import { startTracking } from "@/lib/tracker";

export function Analytics() {
  useEffect(() => {
    startTracking();
  }, []);
  return null;
}
