"use client";

import { useEffect, useState, startTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  EXAMPLE_REPOS,
  exampleRepoKey,
  type ExampleRepo,
} from "@/lib/example-repos";
import { parseRepoInput } from "@/lib/parse-repo";

const PLACEHOLDER_INTERVAL_MS = 2 * 60 * 1000;
const CHIP_INTERVAL_MS = 3 * 60 * 1000;
const CHIP_COUNT = 3;

const FALLBACK_EXAMPLE: ExampleRepo = { owner: "vercel", repo: "next.js" };

function exampleAt(index: number): ExampleRepo {
  return EXAMPLE_REPOS[index % EXAMPLE_REPOS.length] ?? FALLBACK_EXAMPLE;
}

function visibleChipWindow(start: number): ExampleRepo[] {
  return Array.from({ length: CHIP_COUNT }, (_, offset) =>
    exampleAt(start + offset),
  );
}

function useCyclingIndex(length: number, intervalMs: number, enabled: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || length <= 1) {
      return;
    }

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, intervalMs, length]);

  // Keep the current index when paused so focus doesn't jump the overlay.
  return index;
}

export function RepoInput() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Gate motion on mount so SSR and the first client paint share one tree.
  const animate = mounted && !reduceMotion;
  const showPlaceholderOverlay = value.length === 0;
  const placeholderEnabled = animate && showPlaceholderOverlay && !focused;
  const chipEnabled = animate;

  const placeholderIndex = useCyclingIndex(
    EXAMPLE_REPOS.length,
    PLACEHOLDER_INTERVAL_MS,
    placeholderEnabled,
  );
  // Offset chips so they don't mirror the placeholder's starting repo.
  const chipStart = useCyclingIndex(
    EXAMPLE_REPOS.length,
    CHIP_INTERVAL_MS,
    chipEnabled,
  );
  const chipWindowStart = (chipStart + CHIP_COUNT) % EXAMPLE_REPOS.length;

  const activeExample = exampleAt(placeholderIndex);
  const chips = visibleChipWindow(chipWindowStart);

  function goToRepo(owner: string, repo: string) {
    setError(null);
    startTransition(() => {
      router.push(`/${owner}/${repo}`);
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepoInput(value);

    if (!parsed.ok) {
      setError(parsed.error);

      return;
    }

    goToRepo(parsed.owner, parsed.repo);
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <TextField
          fullWidth
          isInvalid={Boolean(error)}
          name="repo"
          value={value}
          onChange={setValue}
        >
          <Label>Public GitHub repo</Label>
          <div className="relative w-full">
            <Input
              className="w-full"
              placeholder={
                showPlaceholderOverlay ? undefined : "owner/repo or GitHub URL"
              }
              onBlur={() => setFocused(false)}
              onFocus={() => setFocused(true)}
            />
            {showPlaceholderOverlay ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3 text-sm text-muted sm:px-4"
              >
                <span className="inline-flex min-w-0 items-center gap-1 truncate">
                  <span className="relative inline-flex h-[1.25em] items-center overflow-hidden">
                    <AnimatePresence initial={false} mode="wait">
                      <motion.span
                        key={exampleRepoKey(activeExample)}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block font-medium"
                        exit={animate ? { opacity: 0, y: -8 } : undefined}
                        initial={animate ? { opacity: 0, y: 8 } : false}
                        transition={{
                          duration: animate ? 0.28 : 0,
                          ease: "easeOut",
                        }}
                      >
                        {exampleRepoKey(activeExample)}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="shrink-0">or paste a GitHub URL</span>
                </span>
              </div>
            ) : null}
          </div>
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            <Description>
              Paste a URL or owner/repo. Only public repositories for now.
            </Description>
          )}
        </TextField>
        <Button fullWidth className="sm:w-auto" type="submit">
          Show me the timeline
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2.5 sm:items-start">
        <p className="text-muted text-sm">Or try one of these:</p>
        <div className="flex min-h-8 flex-wrap justify-center gap-2 sm:justify-start">
          <AnimatePresence initial={false} mode="popLayout">
            {chips.map((example) => (
              <motion.div
                key={exampleRepoKey(example)}
                animate={animate ? { opacity: 1, y: 0, scale: 1 } : undefined}
                exit={animate ? { opacity: 0, y: -6, scale: 0.96 } : undefined}
                initial={animate ? { opacity: 0, y: 6, scale: 0.96 } : false}
                layout={animate}
                transition={{ duration: animate ? 0.28 : 0, ease: "easeOut" }}
              >
                <Button
                  className="rounded-full border border-border/60 bg-surface-secondary/80 px-3 text-xs font-medium"
                  size="sm"
                  type="button"
                  variant="secondary"
                  onPress={() => goToRepo(example.owner, example.repo)}
                >
                  {exampleRepoKey(example)}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
