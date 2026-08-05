import { ImageResponse } from "next/og";

import { getSnapshot } from "@/lib/cache";
import { isValidOwnerRepoParams } from "@/lib/errors";
import { safeGitHubAvatarUrl } from "@/lib/safe-url";

// Cache-only: social crawlers must not trigger cold GitHub builds.
export const maxDuration = 30;

/**
 * Rendering is unmetered (crawlers don't spend the per-IP build budget), so
 * lean on the CDN rather than re-rasterising per request. A cache miss renders
 * the branded fallback, which must expire quickly so the richer card appears
 * once the timeline lands.
 */
const CACHE_HIT = "public, max-age=3600, s-maxage=86400, immutable";
const CACHE_MISS = "public, max-age=60, s-maxage=300";

export const alt = "Repolens timeline";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{ owner: string; repo: string }>;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;

  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export default async function Image({ params }: OgImageProps) {
  const { owner, repo } = await params;
  const fullName = `${owner}/${repo}`;

  let description: string | null = null;
  let avatarUrl: string | null = null;

  // Read the Supabase snapshot only — never call buildTimeline from OG.
  // On a miss we still render a branded card with the owner/repo slug.
  const timeline = isValidOwnerRepoParams(owner, repo)
    ? await getSnapshot(owner, repo)
    : null;

  if (timeline) {
    description = timeline.meta.description;
    avatarUrl = safeGitHubAvatarUrl(timeline.meta.avatarUrl) ?? null;
  }

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          {avatarUrl ? (
            // biome-ignore lint/performance/noImgElement: next/og ImageResponse requires <img>
            <img
              alt=""
              height={96}
              src={avatarUrl}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                border: "2px solid #27272a",
              }}
              width={96}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                background: "#27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 700,
                color: "#a1a1aa",
              }}
            >
              {owner.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              {fullName}
            </div>
            {description ? (
              <div
                style={{
                  fontSize: 28,
                  color: "#a1a1aa",
                  lineHeight: 1.35,
                  maxWidth: 900,
                }}
              >
                {truncate(description, 140)}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 28, color: "#71717a" }}>
            {`Repository timeline`}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#e4e4e7",
            }}
          >
            Repolens
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": timeline ? CACHE_HIT : CACHE_MISS,
      },
    },
  );
}
