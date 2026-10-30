"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition, type MouseEvent } from "react";
import { setFavorite } from "@/actions/listing-interactions";
import { useToast } from "@/components/ui/toast";
import { favoritesStore } from "@/lib/favorites/favorites-store";
import { addFavoriteHref } from "@/lib/favorites/routes";
import { bs } from "@/lib/i18n/bs";
import { interactionErrorMessage } from "@/lib/listings/interaction-errors";

export function useFavorite(listingId: string) {
  const snapshot = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot,
  );
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  const isFavorite = snapshot.ids.has(listingId);

  const toggle = () =>
    startTransition(async () => {
      const next = !isFavorite;
      favoritesStore.set(listingId, next);
      const result = await setFavorite(listingId, next);
      if (result.ok) {
        showToast(next ? bs.detail.favoriteAdded : bs.detail.favoriteRemoved, next ? "success" : "info");
      } else {
        favoritesStore.set(listingId, !next);
        showToast(interactionErrorMessage(result.error), "error");
      }
    });

  return {
    canToggle: snapshot.status === "ready",
    isFavorite,
    pending,
    toggle,
    guestHref: addFavoriteHref(listingId, pathname),
    onGuestClick: (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      router.push(addFavoriteHref(listingId, `${window.location.pathname}${window.location.search}`));
    },
  };
}
