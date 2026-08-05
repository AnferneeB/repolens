import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = siteConfig.description;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: 64,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                border: "3px solid #e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: "#e4e4e7",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {siteConfig.name}
            </div>
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            {`Timelines for public GitHub repos`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 26,
              color: "#a1a1aa",
              maxWidth: 720,
              lineHeight: 1.4,
            }}
          >
            First commit · Releases · Top contributors · Activity spikes
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#71717a",
            }}
          >
            v0.1
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
