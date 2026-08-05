"use client";

import type { TimelineEvent } from "@/types/timeline";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Avatar, Chip, Link } from "@heroui/react";

import { EventCard, EventMarker } from "./event-card";
import { EVENT_CONFIG, EVENT_TYPES } from "./event-config";
import { GroupedView } from "./grouped-view";
import { ShareLinkButton } from "./share-link-button";
import {
  TimelineControls,
  type SortDir,
  type ViewMode,
} from "./timeline-controls";
import { TimelineSummary } from "./timeline-summary";

import { safeGitHubAvatarUrl, safeGitHubPageUrl } from "@/lib/safe-url";
import { useTRPC } from "@/lib/trpc/client";

type TimelineViewProps = {
  owner: string;
  repo: string;
};

function formatStars(n: number): string {
  return n.toLocaleString();
}

function parseSortDir(value: string | null): SortDir {
  return value === "desc" ? "desc" : "asc";
}

function parseViewMode(value: string | null): ViewMode {
  return value === "grouped" ? "grouped" : "timeline";
}

function parseHiddenTypes(value: string | null): Set<TimelineEvent["type"]> {
  const hidden = new Set<TimelineEvent["type"]>();

  if (!value) {
    return hidden;
  }

  for (const part of value.split(",")) {
    if (
      part === "first_commit" ||
      part === "release" ||
      part === "top_contributor" ||
      part === "activity_spike"
    ) {
      hidden.add(part);
    }
  }

  return hidden;
}

function defaultVisibleTypes(
  hidden: Set<TimelineEvent["type"]>,
): Set<TimelineEvent["type"]> {
  return new Set(EVENT_TYPES.filter((type) => !hidden.has(type)));
}

function readControlsFromSearch(search: string): {
  visibleTypes: Set<TimelineEvent["type"]>;
  sortDir: SortDir;
  viewMode: ViewMode;
} {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );

  return {
    visibleTypes: defaultVisibleTypes(parseHiddenTypes(params.get("hide"))),
    sortDir: parseSortDir(params.get("sort")),
    viewMode: parseViewMode(params.get("view")),
  };
}

export function TimelineView({ owner, repo }: TimelineViewProps) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.timeline.get.queryOptions({ owner, repo }),
  );
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  // Seed only — ongoing control changes use history.replaceState so we
  // don't wait on a Next.js soft navigation / searchParams round-trip.
  const searchParams = useSearchParams();

  const [visibleTypes, setVisibleTypes] = useState(() =>
    defaultVisibleTypes(parseHiddenTypes(searchParams.get("hide"))),
  );
  const [sortDir, setSortDir] = useState<SortDir>(() =>
    parseSortDir(searchParams.get("sort")),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    parseViewMode(searchParams.get("view")),
  );

  /** Soft URL update — no Next.js navigation / RSC refetch. */
  const syncUrl = useCallback(
    (
      nextVisible: Set<TimelineEvent["type"]>,
      nextSort: SortDir,
      nextView: ViewMode,
    ) => {
      const params = new URLSearchParams();

      if (nextView !== "timeline") {
        params.set("view", nextView);
      }

      if (nextSort !== "asc") {
        params.set("sort", nextSort);
      }

      const hidden = EVENT_TYPES.filter((type) => !nextVisible.has(type));

      if (hidden.length > 0) {
        params.set("hide", hidden.join(","));
      }

      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;

      window.history.replaceState(window.history.state, "", href);
    },
    [pathname],
  );

  // Back/forward only — we deliberately avoid coupling to Next searchParams
  // so control changes stay instant.
  useEffect(() => {
    function onPopState() {
      const next = readControlsFromSearch(window.location.search);

      startTransition(() => {
        setVisibleTypes(next.visibleTypes);
        setSortDir(next.sortDir);
        setViewMode(next.viewMode);
      });
    }

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleVisibleTypesChange = useCallback(
    (next: Set<TimelineEvent["type"]>) => {
      startTransition(() => {
        setVisibleTypes(next);
      });
      syncUrl(next, sortDir, viewMode);
    },
    [sortDir, syncUrl, viewMode],
  );

  const handleSortDirChange = useCallback(
    (next: SortDir) => {
      startTransition(() => {
        setSortDir(next);
      });
      syncUrl(visibleTypes, next, viewMode);
    },
    [syncUrl, viewMode, visibleTypes],
  );

  const handleViewModeChange = useCallback(
    (next: ViewMode) => {
      startTransition(() => {
        setViewMode(next);
      });
      syncUrl(visibleTypes, sortDir, next);
    },
    [sortDir, syncUrl, visibleTypes],
  );

  const { meta, events, cached } = data;
  const repoHref = safeGitHubPageUrl(meta.htmlUrl);
  const ownerAvatarSrc = safeGitHubAvatarUrl(meta.avatarUrl);

  const counts = useMemo(() => {
    const next = {
      first_commit: 0,
      release: 0,
      top_contributor: 0,
      activity_spike: 0,
    } satisfies Record<TimelineEvent["type"], number>;

    for (const event of events) {
      next[event.type] += 1;
    }

    return next;
  }, [events]);

  const displayed = useMemo(() => {
    const filtered = events.filter((event) => visibleTypes.has(event.type));
    const sorted = [...filtered].sort((a, b) => {
      const delta = a.date.getTime() - b.date.getTime();

      return sortDir === "asc" ? delta : -delta;
    });

    return sorted;
  }, [events, sortDir, visibleTypes]);

  return (
    <section
      className={`mx-auto space-y-6 pb-12 ${viewMode === "grouped" ? "max-w-7xl" : "max-w-5xl"}`}
    >
      {/*
        Sticky (same scheme as the site nav) — fixed + sticky desync during
        macOS rubber-band overscroll and open a gap that looks like an extra nav.
        Full-bleed via margin breakout (no transform — that breaks sticky).
      */}
      <div className="sticky top-16 z-30 ml-[calc(50%-50vw)] w-screen border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div
            className={`mx-auto space-y-2 py-2.5 ${viewMode === "grouped" ? "max-w-7xl" : "max-w-5xl"}`}
          >
            <header className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar
                    aria-label={`${meta.owner}'s avatar`}
                    className="size-8 shrink-0"
                    size="sm"
                  >
                    {ownerAvatarSrc ? (
                      <Avatar.Image alt="" src={ownerAvatarSrc} />
                    ) : null}
                    <Avatar.Fallback className="text-[10px]">
                      {meta.owner.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                        {repoHref ? (
                          <Link
                            className="text-foreground no-underline hover:underline"
                            href={repoHref}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {meta.fullName}
                          </Link>
                        ) : (
                          meta.fullName
                        )}
                      </h1>
                      {cached ? (
                        <Chip size="sm" variant="soft">
                          Cached
                        </Chip>
                      ) : null}
                      <span className="text-xs text-muted">
                        {formatStars(meta.stars)} stars
                        <span aria-hidden> · </span>
                        {formatStars(meta.forks)} forks
                        {meta.language ? (
                          <>
                            <span aria-hidden> · </span>
                            {meta.language}
                          </>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </div>
                <ShareLinkButton title={meta.fullName} />
              </div>

              <TimelineSummary compact events={events} meta={meta} />
            </header>

            <TimelineControls
              counts={counts}
              sortDir={sortDir}
              viewMode={viewMode}
              visibleTypes={visibleTypes}
              onSortDirChange={handleSortDirChange}
              onViewModeChange={handleViewModeChange}
              onVisibleTypesChange={handleVisibleTypesChange}
            />
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-muted">No timeline events found for this repo.</p>
      ) : displayed.length === 0 ? (
        <p className="text-muted">
          No events match the current filters. Try turning a type back on.
        </p>
      ) : viewMode === "grouped" ? (
        <GroupedView events={displayed} />
      ) : (
        <TimelineList events={displayed} reduceMotion={!!reduceMotion} />
      )}
    </section>
  );
}

function TimelineList({
  events,
  reduceMotion,
}: {
  events: TimelineEvent[];
  reduceMotion: boolean;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.75", "end 0.35"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001,
  });
  const progressScale = useTransform(progress, [0, 1], [0, 1]);

  return (
    <ol ref={listRef} className="relative space-y-10 md:space-y-14">
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-[1.125rem] w-px bg-separator md:hidden"
      />
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-1/2 hidden w-px -translate-x-1/2 bg-separator md:block"
      />
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="absolute top-2 bottom-2 left-1/2 hidden w-px origin-top -translate-x-1/2 bg-accent md:block"
          style={{ scaleY: progressScale }}
        />
      ) : null}

      {events.map((event, index) => (
        <EventRow
          key={event.id}
          event={event}
          index={index}
          reduceMotion={reduceMotion}
        />
      ))}
    </ol>
  );
}

function EventRow({
  event,
  index,
  reduceMotion,
}: {
  event: TimelineEvent;
  index: number;
  reduceMotion: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const config = EVENT_CONFIG[event.type];
  const isLeft = index % 2 === 0;

  return (
    <motion.li
      ref={ref}
      animate={
        reduceMotion || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
      }
      className="relative pl-12 md:px-0 md:pl-0"
      initial={false}
      transition={{
        duration: reduceMotion ? 0 : 0.4,
        delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.18),
        ease: "easeOut",
      }}
    >
      <div
        aria-hidden
        className="absolute top-3 left-0 z-10 flex w-9 justify-center md:left-1/2 md:-translate-x-1/2"
      >
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
}
