"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type ViewMode = "timeline" | "grouped";

type TimelineSkeletonProps = {
  /** Override URL detection (e.g. Suspense fallback). */
  view?: ViewMode;
};

export function TimelineSkeleton({ view }: TimelineSkeletonProps) {
  if (view) {
    return <TimelineSkeletonBody view={view} />;
  }

  return (
    <Suspense fallback={<TimelineSkeletonBody view="timeline" />}>
      <TimelineSkeletonFromUrl />
    </Suspense>
  );
}

function TimelineSkeletonFromUrl() {
  const searchParams = useSearchParams();
  const view: ViewMode =
    searchParams.get("view") === "grouped" ? "grouped" : "timeline";

  return <TimelineSkeletonBody view={view} />;
}

function TimelineSkeletonBody({ view }: { view: ViewMode }) {
  const wide = view === "grouped";

  return (
    <section
      aria-busy="true"
      aria-label="Loading timeline"
      className={`mx-auto space-y-6 pb-12 ${wide ? "max-w-7xl" : "max-w-5xl"}`}
    >
      <ChromeSkeleton wide={wide} />

      {view === "grouped" ? <GroupedSkeleton /> : <TimelineRailSkeleton />}
    </section>
  );
}

function ChromeSkeleton({ wide }: { wide: boolean }) {
  return (
    <div className="sticky top-16 z-30 ml-[calc(50%-50vw)] w-screen border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`mx-auto space-y-2 py-2.5 ${wide ? "max-w-7xl" : "max-w-5xl"}`}
        >
          <header className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="size-8 shrink-0 animate-pulse rounded-full bg-surface" />
                <div className="min-w-0 space-y-1.5">
                  <div className="h-6 w-48 animate-pulse rounded-md bg-surface sm:w-64" />
                  <div className="h-3 w-40 animate-pulse rounded-md bg-surface" />
                </div>
              </div>
              <div className="h-8 w-24 animate-pulse rounded-md bg-surface" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["a", "b", "c", "d"] as const).map((id) => (
                <div
                  key={id}
                  className="h-6 w-24 animate-pulse rounded-full bg-surface"
                />
              ))}
            </div>
          </header>
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-52 animate-pulse rounded-lg bg-surface" />
            <div className="h-8 w-36 animate-pulse rounded-lg bg-surface" />
            <div className="h-8 w-32 animate-pulse rounded-lg bg-surface" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineRailSkeleton() {
  return (
    <ol className="relative space-y-10 md:space-y-14">
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-[1.125rem] w-px bg-separator md:hidden"
      />
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-1/2 hidden w-px -translate-x-1/2 bg-separator md:block"
      />

      {(["a", "b", "c", "d", "e"] as const).map((id, index) => {
        const isLeft = index % 2 === 0;

        return (
          <li key={id} className="relative pl-12 md:px-0 md:pl-0">
            <div
              aria-hidden
              className="absolute top-3 left-0 z-10 flex w-9 justify-center md:left-1/2 md:-translate-x-1/2"
            >
              <span className="size-9 animate-pulse rounded-full bg-surface" />
            </div>
            <div
              className={
                isLeft
                  ? "md:mr-auto md:w-[calc(50%-1.75rem)] md:pr-2"
                  : "md:ml-auto md:w-[calc(50%-1.75rem)] md:pl-2"
              }
            >
              <SkeletonCard align={isLeft ? "right" : "left"} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function GroupedSkeleton() {
  return (
    <>
      {/* Mobile tabs placeholder */}
      <div className="space-y-4 md:hidden">
        <div className="flex gap-2">
          {(["a", "b", "c"] as const).map((id) => (
            <div
              key={id}
              className="h-8 w-24 animate-pulse rounded-lg bg-surface"
            />
          ))}
        </div>
        <div className="space-y-3">
          {(["a", "b", "c"] as const).map((id) => (
            <SkeletonCard key={id} align="left" />
          ))}
        </div>
      </div>

      {/* Desktop bento mosaic */}
      <div className="hidden grid-cols-6 gap-4 md:grid lg:grid-cols-12">
        {/* Releases hero */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-surface-secondary p-4 md:col-span-6 lg:col-span-8 lg:row-span-2">
          <div className="flex items-center gap-2">
            <div className="size-8 animate-pulse rounded-full bg-surface" />
            <div className="h-4 w-20 animate-pulse rounded-md bg-surface" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["a", "b", "c", "d", "e", "f"] as const).map((id) => (
              <SkeletonCard key={id} align="left" />
            ))}
          </div>
        </div>

        {/* First commit */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-surface-secondary p-4 md:col-span-6 lg:col-span-4">
          <div className="flex items-center gap-2">
            <div className="size-8 animate-pulse rounded-full bg-surface" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-surface" />
          </div>
          <SkeletonCard align="left" />
        </div>

        {/* Contributors */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-surface-secondary p-4 md:col-span-3 lg:col-span-4">
          <div className="flex items-center gap-2">
            <div className="size-8 animate-pulse rounded-full bg-surface" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-surface" />
          </div>
          <div className="space-y-3">
            {(["a", "b", "c"] as const).map((id) => (
              <SkeletonCard key={id} align="left" />
            ))}
          </div>
        </div>

        {/* Activity spikes */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-surface-secondary p-4 md:col-span-3 lg:col-span-8">
          <div className="flex items-center gap-2">
            <div className="size-8 animate-pulse rounded-full bg-surface" />
            <div className="h-4 w-28 animate-pulse rounded-md bg-surface" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(["a", "b", "c"] as const).map((id) => (
              <SkeletonCard key={id} align="left" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function SkeletonCard({ align }: { align: "left" | "right" }) {
  const end = align === "right" ? "md:items-end" : "";
  const row = align === "right" ? "md:flex-row-reverse" : "";

  return (
    <div className={`space-y-3 rounded-2xl bg-surface p-4 ${end}`}>
      <div className={`flex gap-2 ${row}`}>
        <div className="h-5 w-24 animate-pulse rounded-full bg-surface-secondary" />
        <div className="h-5 w-28 animate-pulse rounded-md bg-surface-secondary" />
      </div>
      <div
        className={`h-5 w-48 animate-pulse rounded-md bg-surface-secondary ${align === "right" ? "md:ml-auto" : ""}`}
      />
      <div
        className={`h-4 w-full max-w-sm animate-pulse rounded-md bg-surface-secondary ${align === "right" ? "md:ml-auto" : ""}`}
      />
    </div>
  );
}
