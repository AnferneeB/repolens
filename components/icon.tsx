"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useEffect, useState } from "react";

type IconProps = {
  icon: IconSvgElement;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

/**
 * Hugeicons duotone paths can serialize in different order on server vs client,
 * which triggers React hydration mismatches. Render a sized placeholder until
 * mount so SSR HTML matches the first client paint.
 */
export function Icon({
  size = 24,
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: IconProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        aria-hidden={ariaHidden === undefined ? true : ariaHidden}
        className={className}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <HugeiconsIcon
      aria-hidden={ariaHidden}
      className={className}
      size={size}
      {...props}
    />
  );
}
