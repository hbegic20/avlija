"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { setFavorite } from "@/actions/listing-interactions";
import { buttonStyles } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import { interactionErrorMessage } from "@/lib/listings/interaction-errors";

export function FavoriteButton({
  listingId,
  initialFavorite,
  isLoggedIn,
  loginHref,
}: {
  listingId: string;
  initialFavorite: boolean;
  isLoggedIn: boolean;
  loginHref: string;
}) {
  const { showToast } = useToast();
  const [favorite, setFavoriteState] = useState(initialFavorite);
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(favorite);
  const [, startTransition] = useTransition();
  const label = optimisticFavorite ? bs.detail.favorited : bs.detail.favorite;
  const icon = (
    <Heart aria-hidden="true" size={18} strokeWidth={1.5} className={cn(optimisticFavorite && "fill-crijep text-crijep")} />
  );

  if (!isLoggedIn) {
    return (
      <Link href={loginHref} className={buttonStyles({ variant: "secondary" })}>
        {icon}
        {label}
      </Link>
    );
  }

  const toggle = () =>
    startTransition(async () => {
      const next = !favorite;
      setOptimisticFavorite(next);
      const result = await setFavorite(listingId, next);
      if (result.ok) {
        setFavoriteState(next);
        showToast(next ? bs.detail.favoriteAdded : bs.detail.favoriteRemoved, next ? "success" : "info");
      } else {
        showToast(interactionErrorMessage(result.error), "error");
      }
    });

  return (
    <button type="button" onClick={toggle} aria-pressed={optimisticFavorite} className={buttonStyles({ variant: "secondary" })}>
      {icon}
      {label}
    </button>
  );
}
