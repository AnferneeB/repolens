"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorState, ResetButton } from "@/components/error-state";
import { fontSans } from "@/config/fonts";

export default function GlobalError({
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
    <html lang="en">
      <body
        className={`${fontSans.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <main className="container mx-auto max-w-7xl flex-grow px-6 pt-16">
          <ErrorState
            description={<p>Something went wrong. Try again shortly.</p>}
            homeLabel="Home"
            primaryAction={<ResetButton onReset={reset} />}
            title="Something went wrong"
          />
        </main>
      </body>
    </html>
  );
}
