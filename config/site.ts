export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Repolens",
  description:
    "Timelines for public GitHub repos: first commits, releases, contributors, and activity spikes.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  links: {
    github: "https://github.com/AnferneeB/repolens",
  },
};
