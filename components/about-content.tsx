"use client";

import { Button, Chip, Surface } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { EVENT_CONFIG, EVENT_TYPES } from "@/app/[owner]/[repo]/event-config";
import { Icon } from "@/components/icon";
import { siteConfig } from "@/config/site";

const STEPS = [
  {
    title: "Paste a repo",
    body: "Drop in a public GitHub URL or owner/repo.",
  },
  {
    title: "Read the timeline",
    body: "Scroll first commits, releases, top contributors, and activity spikes.",
  },
  {
    title: "Share the page",
    body: "Send the URL — anyone can open the same story without signing in.",
  },
] as const;

export function AboutContent() {
  const router = useRouter();

  return (
    <div className="space-y-12 py-2">
      <header className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            About {siteConfig.name}
          </h1>
          <p className="text-muted text-lg leading-relaxed">
            {siteConfig.description}
          </p>
        </div>
        <Button onPress={() => router.push("/")}>Try a repo</Button>
      </header>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">What you get</h2>
          <p className="text-muted leading-relaxed">
            Four event types make up the timeline.
          </p>
        </div>
        <ul className="space-y-3">
          {EVENT_TYPES.map((type) => {
            const config = EVENT_CONFIG[type];

            return (
              <li key={type}>
                <Surface
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${config.softBorder} ${config.softBg}`}
                  variant="secondary"
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border ${config.markerBg} ${config.softBorder} ${config.accent}`}
                  >
                    <Icon icon={config.icon} size={18} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <Chip
                      className={`${config.softBg} ${config.accent} border ${config.softBorder}`}
                      size="sm"
                      variant="soft"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Icon
                          aria-hidden
                          icon={config.icon}
                          size={14}
                          strokeWidth={1.5}
                        />
                        {config.label}
                      </span>
                    </Chip>
                    <p className="text-muted text-sm leading-relaxed">
                      {config.blurb}
                    </p>
                  </div>
                </Surface>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
        <ol className="space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Surface
                className="flex items-start gap-3 rounded-xl border border-border/60 px-4 py-3"
                variant="secondary"
              >
                <span className="bg-accent/15 text-accent flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums">
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium tracking-tight">{step.title}</p>
                  <p className="text-muted text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </Surface>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Scope</h2>
        <p className="text-muted leading-relaxed">
          v0.1 is intentionally small: public repos, four event types, a
          shareable URL. That&apos;s the product.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-8 text-sm">
        <Link className="text-accent no-underline hover:underline" href="/">
          Try a repo
        </Link>
        <span aria-hidden className="text-muted">
          ·
        </span>
        <Link
          className="text-accent no-underline hover:underline"
          href={siteConfig.links.github}
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub
        </Link>
      </section>
    </div>
  );
}
