"use client";

import { useEffect } from "react";
import { favoritesStore } from "@/lib/favorites/favorites-store";

export function FavoritesSync({ loggedIn, ids }: { loggedIn: boolean; ids: string[] }) {
  useEffect(() => {
    favoritesStore.hydrate(loggedIn, ids);
  }, [loggedIn, ids]);
  return null;
}
