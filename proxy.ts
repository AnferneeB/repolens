import { NextResponse, type NextRequest } from "next/server";

/**
 * Sentry's CSP collector, derived from the DSN
 * (`https://<key>@<host>/<projectId>`). Returns null when the DSN is unset or
 * malformed so a bad value degrades to "no reporting" rather than a broken
 * policy directive.
 */
export function cspReportEndpoint(dsn: string | undefined): string | null {
  if (!dsn) {
    return null;
  }

  try {
    const { protocol, host, username, pathname } = new URL(dsn);
    const projectId = pathname.replace(/^\//, "");

    if (!username || !projectId) {
      return null;
    }

    return `${protocol}//${host}/api/${projectId}/security/?sentry_key=${username}`;
  } catch {
    return null;
  }
}

const REPORT_ENDPOINT = cspReportEndpoint(process.env.NEXT_PUBLIC_SENTRY_DSN);
const REPORT_GROUP = "csp-endpoint";

/**
 * Nonce-based CSP, enforced.
 *
 * The nonce is attached to the *request* so Next.js stamps it onto the scripts
 * and styles it emits. This only works for per-request renders: prerendered
 * HTML is built once and shared, so it cannot carry a nonce, and because
 * `'strict-dynamic'` discards the `'self'` fallback an unnonced script is
 * blocked outright — the page still renders but never hydrates. That is why
 * `app/layout.tsx` forces dynamic rendering for every HTML route. Adding a
 * prerendered route without a nonce will silently break its JavaScript.
 *
 * Responses must not be CDN-cached, or one visitor's nonce would be replayed to
 * others alongside a mismatched header.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // Production Analytics / Speed Insights load from first-party `/_vercel/*`
  // (covered by 'self'). In local `next dev` the SDKs pull debug scripts from
  // va.vercel-scripts.com, so allow that host only when developing.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""};
    style-src 'self' 'nonce-${nonce}';
    style-src-attr 'unsafe-inline';
    img-src 'self' blob: data: https://avatars.githubusercontent.com https://*.githubusercontent.com;
    font-src 'self';
    connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io${isDev ? " https://va.vercel-scripts.com https://vitals.vercel-insights.com" : ""};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    ${REPORT_ENDPOINT ? `report-to ${REPORT_GROUP}; report-uri ${REPORT_ENDPOINT};` : ""}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  // Next reads this request header to apply the nonce to emitted tags.
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", cspHeader);

  // `report-uri` is deprecated but still the most widely honoured; `report-to`
  // needs this companion header to resolve the group name.
  if (REPORT_ENDPOINT) {
    response.headers.set(
      "Reporting-Endpoints",
      `${REPORT_GROUP}="${REPORT_ENDPOINT}"`,
    );
  }

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
