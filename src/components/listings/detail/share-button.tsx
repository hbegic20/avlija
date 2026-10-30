"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { bs } from "@/lib/i18n/bs";

export function ShareButton({ path, title }: { path: string; title: string }) {
  const { showToast } = useToast();

  const share = async () => {
    const url = `${window.location.origin}${path}`;
    const prefersNativeShare = typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
    if (prefersNativeShare) {
      try {
        await navigator.share({ url, title });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(bs.detail.linkCopied, "info");
    } catch {
      window.prompt(bs.detail.share, url);
    }
  };

  return (
    <Button variant="secondary" onClick={() => void share()}>
      <Share2 aria-hidden="true" size={18} strokeWidth={1.5} />
      {bs.detail.share}
    </Button>
  );
}
