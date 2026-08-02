import { NextResponse, type NextRequest } from "next/server";

/**
 * Nonce-based CSP. The policy is attached to the *request* so Next.js can
 * stamp framework scripts/styles with the nonce. The *response* uses
 * Report-Only for v0.1 ship — flip to Content-Security-Policy after
 * confirming no violations in Sentry/browser consoles.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https://avatars.githubusercontent.com https://*.githubusercontent.com;
    font-src 'self';
    connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
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

  // Report-Only until we've confirmed zero false positives in prod.
  response.headers.set("Content-Security-Policy-Report-Only", cspHeader);

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
