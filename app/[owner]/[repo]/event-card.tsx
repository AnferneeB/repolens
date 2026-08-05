"use client";

import type { TimelineEvent } from "@/types/timeline";

import { Avatar, Card, Chip, Link, Tooltip } from "@heroui/react";

import { EVENT_CONFIG } from "./event-config";

import { Icon } from "@/components/icon";
import { safeGitHubAvatarUrl, safeGitHubPageUrl } from "@/lib/safe-url";

export const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function EventMarker({
  config,
}: {
  config: (typeof EVENT_CONFIG)[TimelineEvent["type"]];
}) {
  return (
    <span
      aria-hidden
      className={`flex size-9 items-center justify-center rounded-full border ${config.markerBg} ${config.softBorder} ${config.accent}`}
    >
      <Icon icon={config.icon} size={18} strokeWidth={1.5} />
    </span>
  );
}

export function EventCard({
  event,
  align = "left",
  compact = false,
}: {
  event: TimelineEvent;
  align?: "left" | "right";
  /** Drop alternating text alignment (used in grouped lanes). */
  compact?: boolean;
}) {
  const config = EVENT_CONFIG[event.type];
  const alignRight = !compact && align === "right";
  const eventHref = safeGitHubPageUrl(event.url);

  return (
    <Card
      className={`w-full ${alignRight ? "md:text-right" : ""}`}
      variant="secondary"
    >
      <Card.Header className={alignRight ? "md:items-end" : undefined}>
        <div
          className={`flex flex-wrap items-center gap-2 ${alignRight ? "md:flex-row-reverse" : ""}`}
        >
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
          <time
            className="text-sm text-muted"
            dateTime={event.date.toISOString()}
          >
            {dateFormatter.format(event.date)}
          </time>
        </div>
        <Card.Title className="text-base leading-snug">
          {eventHref ? (
            <Link
              className="text-foreground no-underline hover:underline"
              href={eventHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              {event.title}
            </Link>
          ) : (
            event.title
          )}
        </Card.Title>
        {event.description ? (
          <Card.Description className="line-clamp-3">
            {event.description}
          </Card.Description>
        ) : null}
      </Card.Header>
      <Card.Content>
        <EventDetail align={alignRight ? "right" : "left"} event={event} />
      </Card.Content>
    </Card>
  );
}

function EventDetail({
  event,
  align,
}: {
  event: TimelineEvent;
  align: "left" | "right";
}) {
  const rowClass = `flex flex-wrap items-center gap-2 text-sm text-muted ${align === "right" ? "md:justify-end" : ""}`;

  switch (event.type) {
    case "first_commit":
      return (
        <p className={rowClass}>
          <span className="font-mono text-xs">{event.sha.slice(0, 7)}</span>
          {event.authorLogin ? <span>by {event.authorLogin}</span> : null}
        </p>
      );
    case "release":
      return (
        <div className={rowClass}>
          <Tooltip delay={0}>
            <Tooltip.Trigger>
              <Chip size="sm" variant="soft">
                {event.tagName}
              </Chip>
            </Tooltip.Trigger>
            <Tooltip.Content className="max-w-xs text-sm">
              The version label GitHub uses for this release (e.g. v1.2.0).
            </Tooltip.Content>
          </Tooltip>
          {event.isPrerelease ? (
            <Tooltip delay={0}>
              <Tooltip.Trigger>
                <Chip size="sm" variant="soft">
                  Prerelease
                </Chip>
              </Tooltip.Trigger>
              <Tooltip.Content className="max-w-xs text-sm">
                An early or test version — not yet considered the stable
                release.
              </Tooltip.Content>
            </Tooltip>
          ) : null}
        </div>
      );
    case "top_contributor": {
      const avatarSrc = safeGitHubAvatarUrl(event.avatarUrl);

      return (
        <div className={rowClass}>
          <Avatar aria-label={`${event.login}'s avatar`} className="size-6">
            {avatarSrc ? <Avatar.Image alt="" src={avatarSrc} /> : null}
            <Avatar.Fallback className="text-[10px]">
              {event.login.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <span>@{event.login}</span>
          <span aria-hidden>·</span>
          <span>{event.contributions.toLocaleString()} contributions</span>
        </div>
      );
    }
    case "activity_spike":
      return (
        <p className={rowClass}>
          {event.commits.toLocaleString()} commits that week
        </p>
      );
  }
}
