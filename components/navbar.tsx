"use client";

import { Link } from "@heroui/react";
import NextLink from "next/link";
import { useState } from "react";

import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon, Logo } from "@/components/icons";
import { siteConfig } from "@/config/site";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-separator bg-background/70 backdrop-blur-lg">
      <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <NextLink
            className="flex items-center gap-1.5"
            href="/"
            onClick={() => setMenuOpen(false)}
          >
            <Logo />
            <p className="font-bold text-inherit">{siteConfig.name}</p>
          </NextLink>
          <ul className="hidden sm:flex gap-4">
            {siteConfig.navItems.map((item) => (
              <li key={item.href}>
                <NextLink
                  className="text-foreground hover:text-accent transition-colors"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <Link
            aria-label="GitHub"
            href={siteConfig.links.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubIcon className="text-muted" />
          </Link>
          <ThemeSwitch />
          <button
            aria-controls="mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden inline-flex size-9 items-center justify-center rounded-lg text-muted transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden className="flex flex-col gap-1.5">
              <span
                className={`block h-0.5 w-5 bg-current transition-transform ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition-transform ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div
          className="sm:hidden border-t border-separator bg-background/95 px-6 py-3"
          id="mobile-nav"
        >
          <ul className="flex flex-col gap-1">
            {siteConfig.navItems.map((item) => (
              <li key={item.href}>
                <NextLink
                  className="text-foreground hover:text-accent block rounded-lg px-2 py-2 transition-colors"
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NextLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
};
