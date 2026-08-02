import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";

import clsx from "clsx";

import { Providers } from "./providers";

import { Navbar } from "@/components/navbar";
import { fontSans } from "@/config/fonts";
import { siteConfig } from "@/config/site";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="container mx-auto max-w-7xl flex-grow px-6">
              {children}
            </main>
            <footer className="flex w-full flex-wrap items-center justify-center gap-x-1 gap-y-1 py-6 text-sm text-muted">
              <span>
                © {new Date().getFullYear()} {siteConfig.name}
              </span>
              <span aria-hidden>·</span>
              <a
                className="text-accent no-underline hover:underline"
                href="/about"
              >
                About
              </a>
              <span aria-hidden>·</span>
              <a
                className="text-accent no-underline hover:underline"
                href={siteConfig.links.github}
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
