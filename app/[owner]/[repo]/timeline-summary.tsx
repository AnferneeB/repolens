"use client";

import type { RepoMeta, TimelineEvent } from "@/types/timeline";

import { Surface, Tooltip } from "@heroui/react";
import { useMemo } from "react";

import { dateFormatter } from "./event-card";
import { EVENT_CONFIG } from "./event-config";

import { Icon } from "@/components/icon";

type TimelineSummaryProps = {
  meta: RepoMeta;
  events: TimelineEvent[];
  /** Inline chips for the sticky chrome (default: full tile strip). */
  compact?: boolean;
};

export type StatTile = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  blurb: string;
  accent: string;
  softBg: string;
  softBorder: string;
  icon: (typeof EVENT_CONFIG)[TimelineEvent["type"]]["icon"];
};

function formatAge(createdAt: Date): string {
  const now = Date.now();
  const years = (now - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  if (years < 1 / 12) {
    const days = Math.max(1, Math.round(years * 365.25));

    return `${days} day${days === 1 ? "" : "s"}`;
  }

  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12));

    return `${months} mo`;
  }

  const whole = Math.floor(years);
  const remMonths = Math.round((years - whole) * 12);

  if (remMonths === 0) {
    return `${whole} yr${whole === 1 ? "" : "s"}`;
  }

  return `${whole}y ${remMonths}mo`;
}

export function buildSummaryTiles(
  meta: RepoMeta,
  events: TimelineEvent[],
): StatTile[] {
  const releases = events.filter((e) => e.type === "release");
  const contributors = events.filter((e) => e.type === "top_contributor");
  const spikes = events.filter((e) => e.type === "activity_spike");

  const latestRelease = [...releases].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  )[0];
  const busiest = [...spikes].sort((a, b) => b.commits - a.commits)[0];

  return [
    {
      id: "age",
      label: "Age",
      value: formatAge(meta.createdAt),
      detail: `Since ${dateFormatter.format(meta.createdAt)}`,
      blurb: "How long this repository has existed on GitHub.",
      accent: EVENT_CONFIG.first_commit.accent,
      softBg: EVENT_CONFIG.first_commit.softBg,
      softBorder: EVENT_CONFIG.first_commit.softBorder,
      icon: EVENT_CONFIG.first_commit.icon,
    },
    {
      id: "releases",
      label: "Releases",
      value: releases.length.toLocaleString(),
      detail: latestRelease
        ? `Latest ${latestRelease.tagName} · ${dateFormatter.format(latestRelease.date)}`
        : "No releases yet",
      blurb: EVENT_CONFIG.release.blurb,
      accent: EVENT_CONFIG.release.accent,
      softBg: EVENT_CONFIG.release.softBg,
      softBorder: EVENT_CONFIG.release.softBorder,
      icon: EVENT_CONFIG.release.icon,
    },
    {
      id: "contributors",
      label: "Contributors",
      value: contributors.length.toLocaleString(),
      detail:
        contributors.length > 0
          ? "Shown when they first joined"
          : "None surfaced",
      blurb: EVENT_CONFIG.top_contributor.blurb,
      accent: EVENT_CONFIG.top_contributor.accent,
      softBg: EVENT_CONFIG.top_contributor.softBg,
      softBorder: EVENT_CONFIG.top_contributor.softBorder,
      icon: EVENT_CONFIG.top_contributor.icon,
    },
    {
      id: "spike",
      label: "Busiest",
      value: busiest ? `${busiest.commits.toLocaleString()} commits` : "—",
      detail: busiest
        ? dateFormatter.format(busiest.weekStart)
        : "No spikes detected",
      blurb: EVENT_CONFIG.activity_spike.blurb,
      accent: EVENT_CONFIG.activity_spike.accent,
      softBg: EVENT_CONFIG.activity_spike.softBg,
      softBorder: EVENT_CONFIG.activity_spike.softBorder,
      icon: EVENT_CONFIG.activity_spike.icon,
    },
  ];
}

export function TimelineSummary({
  meta,
  events,
  compact = false,
}: TimelineSummaryProps) {
  const tiles = useMemo(() => buildSummaryTiles(meta, events), [meta, events]);

  if (compact) {
    return (
      <div
        aria-label="Repository summary"
        className="flex flex-wrap items-center gap-1.5"
        role="group"
      >
        {tiles.map((tile) => (
          <Tooltip key={tile.id} delay={0}>
            <Tooltip.Trigger>
              <span
                className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${tile.softBorder} ${tile.softBg}`}
              >
                <Icon
                  aria-hidden
                  className={tile.accent}
                  icon={tile.icon}
                  size={12}
                  strokeWidth={1.5}
                />
                <span className="text-muted">{tile.label}</span>
                <span className={`font-semibold tabular-nums ${tile.accent}`}>
                  {tile.value}
                </span>
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content className="max-w-xs text-sm">
              <p>{tile.blurb}</p>
              {tile.detail ? (
                <p className="mt-1 text-muted">{tile.detail}</p>
              ) : null}
            </Tooltip.Content>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <Surface
      aria-label="Repository summary"
      className="grid gap-3 rounded-2xl border border-border/60 p-4 sm:grid-cols-2 lg:grid-cols-4"
      variant="secondary"
    >
      {tiles.map((tile) => (
        <Tooltip key={tile.id} delay={0}>
          <Tooltip.Trigger>
            <div
              className={`flex min-w-0 items-start gap-3 rounded-xl border px-3 py-2.5 ${tile.softBorder} ${tile.softBg}`}
            >
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${tile.softBg} ${tile.accent}`}
              >
                <Icon icon={tile.icon} size={16} strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <p className="text-muted text-xs font-medium tracking-wide uppercase">
                  {tile.label}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {tile.value}
                </p>
                {tile.detail ? (
                  <p className="truncate text-xs text-muted">{tile.detail}</p>
                ) : null}
              </div>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content className="max-w-xs text-sm">
            {tile.blurb}
          </Tooltip.Content>
        </Tooltip>
      ))}
    </Surface>
  );
}
