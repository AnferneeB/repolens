"use client";

import type { TimelineEvent } from "@/types/timeline";

import { Chip, Tooltip } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";

import { EventCard, EventMarker } from "@/app/[owner]/[repo]/event-card";
import { EVENT_CONFIG, EVENT_TYPES } from "@/app/[owner]/[repo]/event-config";
import { Icon } from "@/components/icon";

const PREVIEW_EVENTS: TimelineEvent[] = [
  {
    type: "first_commit",
    id: "preview-first",
    date: new Date("2019-03-12T00:00:00Z"),
    title: "Initial commit",
    description: "Initial project setup.",
    url: "",
    sha: "a1b2c3d",
    authorLogin: "maintainer",
  },
  {
    type: "top_contributor",
    id: "preview-contributor",
    date: new Date("2020-08-04T00:00:00Z"),
    title: "First commit from a top contributor",
    description: null,
    url: "",
    login: "ally",
    avatarUrl: "",
    contributions: 842,
  },
  {
    type: "activity_spike",
    id: "preview-spike",
    date: new Date("2022-11-14T00:00:00Z"),
    title: "Busy week",
    description: "Commit volume well above average.",
    url: null,
    weekStart: new Date("2022-11-14T00:00:00Z"),
    commits: 186,
  },
  {
    type: "release",
    id: "preview-release",
    date: new Date("2024-06-01T00:00:00Z"),
    title: "v1.0.0",
    description: "First stable release.",
    url: "",
    tagName: "v1.0.0",
    isPrerelease: false,
  },
];

export function HomePreview() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="home-preview-heading"
      className="mx-auto w-full max-w-5xl space-y-8"
    >
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h2
          className="text-2xl font-bold tracking-tight"
          id="home-preview-heading"
        >
          What the timeline looks like
        </h2>
        <p className="text-muted leading-relaxed">
          Four event types. Hover for a short definition.
        </p>
        <EventTypeLegend />
      </div>

      <div aria-hidden className="pointer-events-none select-none">
        <ol className="relative space-y-10 md:space-y-14">
          <div className="absolute top-2 bottom-2 left-[1.125rem] w-px bg-separator md:hidden" />
          <div className="absolute top-2 bottom-2 left-1/2 hidden w-px -translate-x-1/2 bg-separator md:block" />

          {PREVIEW_EVENTS.map((event, index) => {
            const config = EVENT_CONFIG[event.type];
            const isLeft = index % 2 === 0;

            return (
              <motion.li
                key={event.id}
                className="relative pl-12 md:px-0 md:pl-0"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.4,
                  delay: reduceMotion ? 0 : Math.min(index * 0.06, 0.24),
                  ease: "easeOut",
                }}
                viewport={{ once: true, amount: 0.25 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              >
                <div className="absolute top-3 left-0 z-10 flex w-9 justify-center md:left-1/2 md:-translate-x-1/2">
                  <EventMarker config={config} />
                </div>

                <div
                  className={
                    isLeft
                      ? "md:mr-auto md:w-[calc(50%-1.75rem)] md:pr-2"
                      : "md:ml-auto md:w-[calc(50%-1.75rem)] md:pl-2"
                  }
                >
                  <EventCard align={isLeft ? "right" : "left"} event={event} />
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function EventTypeLegend() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2 pt-1">
      {EVENT_TYPES.map((type) => {
        const config = EVENT_CONFIG[type];

        return (
          <li key={type}>
            <Tooltip delay={0}>
              <Tooltip.Trigger>
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
              </Tooltip.Trigger>
              <Tooltip.Content className="max-w-xs text-sm">
                {config.blurb}
              </Tooltip.Content>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
