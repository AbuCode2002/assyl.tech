import type { ServiceRowId } from "../_shared/lead-options";

/** 40×40 line glyphs; each stroke carries pathLength=1 so CSS can "draw" it via dashoffset. */
const PATHS: Record<ServiceRowId, string[]> = {
  mobile: [
    "M14 5h12a3.5 3.5 0 0 1 3.5 3.5v23A3.5 3.5 0 0 1 26 35H14a3.5 3.5 0 0 1-3.5-3.5v-23A3.5 3.5 0 0 1 14 5Z",
    "M17.5 9h5",
    "M18 31h4",
    "M15 15h10M15 19h7M15 23h9",
  ],
  web: [
    "M5 8.5h30v23H5Z",
    "M5 14h30",
    "M8.5 11.2h.5M11.5 11.2h.5M14.5 11.2h.5",
    "m17 19.5-3.5 3.5 3.5 3.5M23 19.5l3.5 3.5-3.5 3.5",
  ],
  platform: ["M20 6 34 13 20 20 6 13Z", "m6 20 14 7 14-7", "m6 27 14 7 14-7"],
  ai: [
    "M18 6c1 7.2 6.8 13 14 14-7.2 1-13 6.8-14 14-1-7.2-6.8-13-14-14 7.2-1 13-6.8 14-14Z",
    "M31 4v6M28 7h6",
    "M32 29v4M30 31h4",
  ],
  dashboard: ["M6 6v28h28", "M12 29v-6M18 29v-10M24 29v-5M30 29v-13", "m11 16 7-6 6 4 8-7"],
  automation: [
    "M31.5 16A12 12 0 0 0 9.8 12.6",
    "M8.5 24a12 12 0 0 0 21.7 3.4",
    "M9 6.5v6.5h6.5",
    "M31 33.5V27h-6.5",
    "M20 17a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
  ],
};

export function ServiceGlyph({ id, className }: { id: ServiceRowId; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={className}>
      {PATHS[id].map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transitionDelay: `${i * 90}ms` }}
          className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[900ms] ease-out-expo group-hover/row:[stroke-dashoffset:0] group-aria-expanded/row:[stroke-dashoffset:0] motion-reduce:[stroke-dashoffset:0]"
        />
      ))}
    </svg>
  );
}
