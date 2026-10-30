"use client";

import { useEffect } from "react";
import { recordView } from "@/actions/listing-interactions";

const storagePrefix = "avlija:viewed:";

export function ViewCounter({ listingId }: { listingId: string }) {
  useEffect(() => {
    const key = `${storagePrefix}${listingId}`;
    try {
      if (window.sessionStorage.getItem(key)) {
        return;
      }
      window.sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    void recordView(listingId);
  }, [listingId]);

  return null;
}
