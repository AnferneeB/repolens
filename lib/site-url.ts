/**
 * Absolute site origin for metadata, OG URLs, and server-side fetch.
 * Prefer an explicit public URL (custom domain), then Vercel, then local.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (explicit) {
    return explicit;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
}
