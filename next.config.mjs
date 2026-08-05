import { withSentryConfig } from "@sentry/nextjs";

// Baseline hardening for a public deploy. Enforced nonce CSP is set in
// proxy.ts so Next can stamp framework scripts.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
  // Sourcemap upload needs org + project (and SENTRY_AUTH_TOKEN in the env).
  // Prefer explicit env so local/CI builds without Sentry still succeed.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
