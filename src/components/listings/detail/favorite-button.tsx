"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorite } from "@/components/favorites/use-favorite";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

export function FavoriteButton({ listingId }: { listingId: string }) {
  const { canToggle, isFavorite, toggle, guestHref, onGuestClick } = useFavorite(listingId);
  const label = isFavorite ? bs.detail.favorited : bs.detail.favorite;
  const icon = (
    <Heart aria-hidden="true" size={18} strokeWidth={1.5} className={cn(isFavorite && "fill-crijep text-crijep")} />
  );

  if (!canToggle) {
    return (
      <Link href={guestHref} onClick={onGuestClick} className={buttonStyles({ variant: "secondary" })}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={isFavorite} className={buttonStyles({ variant: "secondary" })}>
      {icon}
      {label}
    </button>
  );
}
