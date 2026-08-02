import type { Metadata } from "next";

import { AboutContent } from "@/components/about-content";
import { siteConfig } from "@/config/site";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "About",
  description: siteConfig.description,
  alternates: {
    canonical: `${getSiteUrl()}/about`,
  },
  openGraph: {
    title: `About - ${siteConfig.name}`,
    description: siteConfig.description,
    url: `${getSiteUrl()}/about`,
  },
  twitter: {
    card: "summary_large_image",
    title: `About - ${siteConfig.name}`,
    description: siteConfig.description,
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
