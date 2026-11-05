"use client";

import type { MouseEvent } from "react";
import { useToast } from "@/components/ui/toast";
import { bs } from "@/lib/i18n/bs";

const touchDeviceQuery = "(pointer: coarse)";

export function ViberShareLink({ message, className }: { message: string; className: string }) {
  const { showToast } = useToast();

  const copyOnDesktop = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia(touchDeviceQuery).matches) {
      return;
    }
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(message);
      showToast(bs.detail.viberDesktopCopied, "info");
    } catch {
      window.prompt(bs.detail.shareViber, message);
    }
  };

  return (
    <a href={`viber://forward?text=${encodeURIComponent(message)}`} onClick={(event) => void copyOnDesktop(event)} className={className}>
      {bs.detail.shareViber}
    </a>
  );
}
