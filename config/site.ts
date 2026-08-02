export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Repolens",
  description:
    "See any public GitHub project's story at a glance — first commits, releases, contributors, and activity spikes on a shareable timeline.",
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
    github: "https://github.com/anfernee/repolens",
  },
};
