"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorState, ResetButton } from "@/components/error-state";

export default function AppError({
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
        <p>
          Something unexpected broke. Try again, or head home and pick another
          repo.
        </p>
      }
      homeLabel="Go home"
      primaryAction={<ResetButton onReset={reset} />}
      title="Something went wrong"
    />
  );
}
