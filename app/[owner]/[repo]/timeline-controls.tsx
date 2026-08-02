"use client";

import type { Key } from "@heroui/react";
import type { TimelineEvent } from "@/types/timeline";

import { ToggleButton, ToggleButtonGroup, Toolbar } from "@heroui/react";
import {
  GridViewIcon,
  SortingAZ01Icon,
  SortingZA01Icon,
  TimelineIcon,
} from "@hugeicons/core-free-icons";

import { EVENT_CONFIG, EVENT_TYPES } from "./event-config";

import { Icon } from "@/components/icon";

export type SortDir = "asc" | "desc";
export type ViewMode = "timeline" | "grouped";

type TimelineControlsProps = {
  counts: Record<TimelineEvent["type"], number>;
  visibleTypes: Set<TimelineEvent["type"]>;
  onVisibleTypesChange: (next: Set<TimelineEvent["type"]>) => void;
  sortDir: SortDir;
  onSortDirChange: (next: SortDir) => void;
  viewMode: ViewMode;
  onViewModeChange: (next: ViewMode) => void;
};

export function TimelineControls({
  counts,
  visibleTypes,
  onVisibleTypesChange,
  sortDir,
  onSortDirChange,
  viewMode,
  onViewModeChange,
}: TimelineControlsProps) {
  return (
    <div>
      <Toolbar
        aria-label="Timeline controls"
        className="flex flex-wrap items-center gap-2"
      >
        <ToggleButtonGroup
          isDetached
          aria-label="Filter event types"
          className="flex-wrap"
          selectedKeys={visibleTypes as Set<Key>}
          selectionMode="multiple"
          size="sm"
          onSelectionChange={(keys) => {
            const next = new Set<TimelineEvent["type"]>();

            for (const key of keys) {
              if (isEventType(key)) {
                next.add(key);
              }
            }

            onVisibleTypesChange(next);
          }}
        >
          {EVENT_TYPES.map((type) => {
            const config = EVENT_CONFIG[type];
            const count = counts[type];

            return (
              <ToggleButton
                key={type}
                aria-label={`${config.label} (${count}). ${config.blurb}`}
                className="gap-1.5"
                id={type}
              >
                <Icon
                  aria-hidden
                  className={config.accent}
                  icon={config.icon}
                  size={14}
                  strokeWidth={1.5}
                />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="text-muted tabular-nums">{count}</span>
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>

        <ToggleButtonGroup
          disallowEmptySelection
          aria-label="Sort order"
          selectedKeys={new Set([sortDir])}
          selectionMode="single"
          size="sm"
          onSelectionChange={(keys) => {
            const key = [...keys][0];

            if (key === "asc" || key === "desc") {
              onSortDirChange(key);
            }
          }}
        >
          <ToggleButton aria-label="Oldest first" className="gap-1.5" id="asc">
            <Icon
              aria-hidden
              icon={SortingAZ01Icon}
              size={14}
              strokeWidth={1.5}
            />
            <span className="hidden sm:inline">Oldest first</span>
          </ToggleButton>
          <ToggleButton aria-label="Newest first" className="gap-1.5" id="desc">
            <ToggleButtonGroup.Separator />
            <Icon
              aria-hidden
              icon={SortingZA01Icon}
              size={14}
              strokeWidth={1.5}
            />
            <span className="hidden sm:inline">Newest first</span>
          </ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          disallowEmptySelection
          aria-label="View mode"
          selectedKeys={new Set([viewMode])}
          selectionMode="single"
          size="sm"
          onSelectionChange={(keys) => {
            const key = [...keys][0];

            if (key === "timeline" || key === "grouped") {
              onViewModeChange(key);
            }
          }}
        >
          <ToggleButton
            aria-label="Timeline view"
            className="gap-1.5"
            id="timeline"
          >
            <Icon aria-hidden icon={TimelineIcon} size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Timeline</span>
          </ToggleButton>
          <ToggleButton
            aria-label="Grouped view"
            className="gap-1.5"
            id="grouped"
          >
            <ToggleButtonGroup.Separator />
            <Icon aria-hidden icon={GridViewIcon} size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Grouped</span>
          </ToggleButton>
        </ToggleButtonGroup>
      </Toolbar>
    </div>
  );
}

function isEventType(key: Key): key is TimelineEvent["type"] {
  return (
    key === "first_commit" ||
    key === "release" ||
    key === "top_contributor" ||
    key === "activity_spike"
  );
}
