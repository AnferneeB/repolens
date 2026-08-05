"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorState, ResetButton } from "@/components/error-state";

export default function RepoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorState
      description={
        <p>Something went wrong fetching this repo. Try again in a moment.</p>
      }
      primaryAction={<ResetButton onReset={reset} />}
      title="Couldn't load this timeline"
    />
  );
}
