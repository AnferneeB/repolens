import type { IconSvgElement } from "@hugeicons/react";
import type { TimelineEvent } from "@/types/timeline";

import {
  ChartIncreaseIcon,
  GitCommitIcon,
  Tag01Icon,
  UserStar01Icon,
} from "@hugeicons/core-free-icons";

export type EventVisualConfig = {
  label: string;
  /** Plain-language explanation for tooltips */
  blurb: string;
  icon: IconSvgElement;
  /** Text / icon accent color */
  accent: string;
  /** Marker fill (tinted) */
  markerBg: string;
  /** Soft chip / badge background */
  softBg: string;
  /** Soft border for cards / markers */
  softBorder: string;
};

export const EVENT_TYPES = [
  "first_commit",
  "release",
  "top_contributor",
  "activity_spike",
] as const satisfies readonly TimelineEvent["type"][];

export const EVENT_CONFIG: Record<TimelineEvent["type"], EventVisualConfig> = {
  first_commit: {
    label: "First commit",
    blurb: "The very first change that started this repository.",
    icon: GitCommitIcon,
    accent: "text-emerald-600 dark:text-emerald-400",
    markerBg: "bg-emerald-500/15",
    softBg: "bg-emerald-500/10",
    softBorder: "border-emerald-500/25",
  },
  release: {
    label: "Release",
    blurb: "A tagged version the maintainers published for others to use.",
    icon: Tag01Icon,
    accent: "text-violet-600 dark:text-violet-400",
    markerBg: "bg-violet-500/15",
    softBg: "bg-violet-500/10",
    softBorder: "border-violet-500/25",
  },
  top_contributor: {
    label: "Contributor",
    blurb: "When a top contributor made their first commit here.",
    icon: UserStar01Icon,
    accent: "text-amber-600 dark:text-amber-400",
    markerBg: "bg-amber-500/15",
    softBg: "bg-amber-500/10",
    softBorder: "border-amber-500/25",
  },
  activity_spike: {
    label: "Activity spike",
    blurb: "A week with unusually high commit volume compared to the rest.",
    icon: ChartIncreaseIcon,
    accent: "text-sky-600 dark:text-sky-400",
    markerBg: "bg-sky-500/15",
    softBg: "bg-sky-500/10",
    softBorder: "border-sky-500/25",
  },
};
