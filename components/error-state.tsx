"use client";

import type { ReactNode } from "react";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

type ErrorStateProps = {
  title: string;
  description: ReactNode;
  /** Optional primary control (e.g. Try again). */
  primaryAction?: ReactNode;
  homeLabel?: string;
};

export function ErrorState({
  title,
  description,
  primaryAction,
  homeLabel = "Pick another repo",
}: ErrorStateProps) {
  return (
    <section className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="text-muted">{description}</div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {primaryAction}
        <NextLink
          className="text-sm text-accent underline-offset-4 hover:underline"
          href="/"
        >
          {homeLabel}
        </NextLink>
      </div>
    </section>
  );
}

/** Client retry that re-fetches the current route (RSC + cache). */
export function RefreshButton({ label = "Try again" }: { label?: string }) {
  const router = useRouter();

  return <Button onPress={() => router.refresh()}>{label}</Button>;
}

export function ResetButton({
  label = "Try again",
  onReset,
}: {
  label?: string;
  onReset: () => void;
}) {
  return <Button onPress={onReset}>{label}</Button>;
}
