"use client";

import type { TimelineEvent } from "@/types/timeline";

import { Surface, Tabs, Tooltip } from "@heroui/react";

import { EventCard } from "./event-card";
import { EVENT_CONFIG, EVENT_TYPES } from "./event-config";

import { Icon } from "@/components/icon";

type GroupedViewProps = {
  events: TimelineEvent[];
};

type Lane = {
  type: TimelineEvent["type"];
  config: (typeof EVENT_CONFIG)[TimelineEvent["type"]];
  items: TimelineEvent[];
};

/**
 * Stable tie-break when two lanes share the same item count —
 * densest category still wins; equal counts keep a predictable order.
 */
const TIE_BREAK: TimelineEvent["type"][] = [
  "release",
  "first_commit",
  "top_contributor",
  "activity_spike",
];

/** Bento span by density rank (0 = densest / hero). */
const BENTO_SLOTS = [
  // Hero: tall + wide, leads the mosaic
  "md:col-span-6 lg:col-span-8 lg:row-span-2",
  // Compact companion beside the hero
  "md:col-span-6 lg:col-span-4",
  // Bottom / side pair
  "md:col-span-3 lg:col-span-4",
  "md:col-span-3 lg:col-span-8",
] as const;

function innerCols(count: number, wide: boolean): string {
  if (count <= 1) return "grid-cols-1";
  if (count <= 3) return "sm:grid-cols-2";
  if (wide) return "sm:grid-cols-2 lg:grid-cols-3";

  return "sm:grid-cols-2";
}

export function GroupedView({ events }: GroupedViewProps) {
  const byType = new Map(
    EVENT_TYPES.map((type) => [
      type,
      {
        type,
        config: EVENT_CONFIG[type],
        items: events.filter((event) => event.type === type),
      } satisfies Lane,
    ]),
  );

  const lanes = [...byType.values()]
    .filter((lane) => lane.items.length > 0)
    .sort((a, b) => {
      const byCount = b.items.length - a.items.length;

      if (byCount !== 0) return byCount;

      return TIE_BREAK.indexOf(a.type) - TIE_BREAK.indexOf(b.type);
    });

  if (lanes.length === 0) {
    return (
      <p className="text-muted">
        No events match the current filters. Try turning a type back on.
      </p>
    );
  }

  const sparse = lanes.length <= 2;

  return (
    <>
      {/* Mobile: tabbed lanes — densest first */}
      <div className="md:hidden">
        <Tabs className="w-full" defaultSelectedKey={lanes[0]?.type}>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Event categories">
              {lanes.map((lane, index) => (
                <Tabs.Tab key={lane.type} id={lane.type}>
                  {index > 0 ? <Tabs.Separator /> : null}
                  <span className="inline-flex items-center gap-1.5">
                    <Icon
                      aria-hidden
                      className={lane.config.accent}
                      icon={lane.config.icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                    {lane.config.label}
                    <span className="text-muted tabular-nums">
                      {lane.items.length}
                    </span>
                  </span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          {lanes.map((lane) => (
            <Tabs.Panel key={lane.type} className="pt-4" id={lane.type}>
              <LaneList cols="grid-cols-1" items={lane.items} />
            </Tabs.Panel>
          ))}
        </Tabs>
      </div>

      {/* Desktop: bento mosaic — densest category gets the hero slot */}
      <div className="hidden grid-cols-6 gap-4 md:grid lg:grid-cols-12">
        {lanes.map((lane, rank) => (
          <BentoTile key={lane.type} lane={lane} rank={rank} sparse={sparse} />
        ))}
      </div>
    </>
  );
}

function BentoTile({
  lane,
  rank,
  sparse,
}: {
  lane: Lane;
  rank: number;
  sparse: boolean;
}) {
  // When only 1–2 lanes remain (filters), stretch them full-width for readability.
  const spanClass = sparse
    ? "md:col-span-6 lg:col-span-12"
    : (BENTO_SLOTS[rank] ?? BENTO_SLOTS[BENTO_SLOTS.length - 1]);

  const isHero = rank === 0 && !sparse;
  const count = lane.items.length;
  const cols = sparse
    ? innerCols(count, count > 2)
    : innerCols(count, isHero || rank === 3);

  const maxHeight = isHero
    ? "max-h-[min(72vh,44rem)]"
    : count <= 1
      ? "max-h-none"
      : "max-h-[min(40vh,22rem)]";

  return (
    <Surface
      className={`flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border p-4 ${lane.config.softBorder} ${spanClass}`}
      variant="secondary"
    >
      <header className="flex shrink-0 items-center gap-2">
        <span
          className={`flex size-8 items-center justify-center rounded-full ${lane.config.markerBg} ${lane.config.accent}`}
        >
          <Icon icon={lane.config.icon} size={16} strokeWidth={1.5} />
        </span>
        <Tooltip delay={0}>
          <Tooltip.Trigger>
            <h2 className={`text-sm font-semibold ${lane.config.accent}`}>
              {lane.config.label}
            </h2>
          </Tooltip.Trigger>
          <Tooltip.Content className="max-w-xs text-sm">
            {lane.config.blurb}
          </Tooltip.Content>
        </Tooltip>
        <span className="ml-auto text-xs text-muted tabular-nums">
          {lane.items.length}
        </span>
      </header>
      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 ${maxHeight}`}
      >
        <LaneList cols={cols} items={lane.items} />
      </div>
    </Surface>
  );
}

function LaneList({ items, cols }: { items: TimelineEvent[]; cols: string }) {
  return (
    <ul className={`grid gap-3 ${cols}`}>
      {items.map((event) => (
        <li key={event.id} className="min-w-0">
          <EventCard compact event={event} />
        </li>
      ))}
    </ul>
  );
}
