import { ImageResponse } from "next/og";
import { BRACKET_STROKE, LOGO_PATHS } from "@/components/ui/logo-paths";

export const alt = "assyl.tech — apps, websites, software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 420"><defs><linearGradient id="g" x1="0" y1="400" x2="430" y2="200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5a5cff"/><stop offset="1" stop-color="#3b82ff"/></linearGradient></defs><path d="${LOGO_PATHS.leftLeg}" fill="#eef2f8"/><path d="${LOGO_PATHS.rightLeg}" fill="#eef2f8"/><path d="${LOGO_PATHS.swoosh}" fill="url(#g)"/><path d="${LOGO_PATHS.brackets}" stroke="#4c6ef5" stroke-width="${BRACKET_STROKE}" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 78% 40%, rgba(59,123,255,0.35), transparent 55%), #030407",
          color: "#eef2f8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 30, letterSpacing: 4, color: "#8d95a8" }}>
          <span style={{ color: "#3b7bff" }}>[00]</span> DEVELOPMENT STUDIO · ALMATY
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>
            <span>Apps.</span>
            <span>Websites.</span>
            <span style={{ color: "#5b8cff" }}>Software.</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width={420} height={285} src={`data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`} alt="" />
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          assyl<span style={{ color: "#3b7bff" }}>.tech</span>
        </div>
      </div>
    ),
    size,
  );
}
