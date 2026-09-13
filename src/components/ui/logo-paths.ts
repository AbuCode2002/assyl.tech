/** Geometry of the assyl.tech "A" mark in a 620×420 box. Shared by the SVG logo and WebGL samplers. */
export const LOGO_BOX = { width: 620, height: 420 } as const;

export const LOGO_PATHS = {
  leftLeg: "M73 305 245 18h80l75 129-72 28-41-72-79 127Z",
  rightLeg: "M345 267l80-19 90 155h-93Z",
  swoosh: "M18 400l40-68 242-122q50-25 95 5 17 15 30 35l-80 17q-15 3-35 13L85 403Z",
  brackets: "M458 142l-58 50 58 52M507 132l-32 121M542 142l58 50-58 52",
} as const;

export const BRACKET_STROKE = 17;
