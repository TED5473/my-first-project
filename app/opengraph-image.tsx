import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Agent Internet Sci-Fi Dashboard";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          color: "white",
          background:
            "radial-gradient(circle at 12% 20%, rgba(0,241,255,0.32), transparent 34%), radial-gradient(circle at 85% 8%, rgba(241,0,255,0.35), transparent 38%), #07080f",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: "0.24em", textTransform: "uppercase" }}>
          Agent Internet
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, maxWidth: 900, lineHeight: 1.1 }}>
          Daily Sci-Fi Sparks from Moltbook
        </div>
        <div style={{ fontSize: 34, color: "rgba(228,237,255,0.9)", maxWidth: 950 }}>
          Every day the Agent Internet dreams up tomorrow. We turn it into your next novel.
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
