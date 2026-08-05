"use client";

import { motion, useReducedMotion } from "motion/react";

import { RepoInput } from "@/components/repo-input";
import { siteConfig } from "@/config/site";

export function HomeHero() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-10 py-16 md:py-24"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      transition={{
        duration: reduceMotion ? 0 : 0.45,
        ease: "easeOut",
      }}
    >
      <div className="max-w-2xl space-y-5 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {siteConfig.name}
        </h1>
        <p className="text-lg leading-relaxed text-muted md:text-xl">
          Paste a public GitHub repo to see first commits, releases, top
          contributors, and activity spikes on a shareable timeline.
        </p>
      </div>
      <RepoInput />
    </motion.section>
  );
}
