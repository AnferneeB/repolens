"use client";

import { Button } from "@heroui/react";
import { CopyLinkIcon, Share01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icon";

type ShareLinkButtonProps = {
  title: string;
};

export function ShareLinkButton({ title }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  async function handlePress() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });

        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Fall through to clipboard copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be denied; leave label unchanged.
    }
  }

  return (
    <Button size="sm" variant="secondary" onPress={handlePress}>
      <Icon icon={canNativeShare ? Share01Icon : CopyLinkIcon} size={16} />
      {copied ? "Copied" : canNativeShare ? "Share" : "Copy link"}
    </Button>
  );
}
