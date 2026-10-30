"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import { useFavorite } from "./use-favorite";

const heartClasses =
  "inline-flex size-9 items-center justify-center rounded-xs border bg-papir text-tinta transition-colors hover:bg-papir-2";

export function FavoriteHeart({ listingId, title, className }: { listingId: string; title: string; className?: string }) {
  const { canToggle, isFavorite, toggle, guestHref, onGuestClick } = useFavorite(listingId);
  const label = isFavorite ? bs.favorites.remove(title) : bs.favorites.add(title);
  const icon = (
    <Heart aria-hidden="true" size={18} strokeWidth={1.5} className={cn(isFavorite && "fill-crijep text-crijep")} />
  );

  if (!canToggle) {
    return (
      <Link href={guestHref} onClick={onGuestClick} aria-label={label} title={label} className={cn(heartClasses, className)}>
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      className={cn(heartClasses, className)}
    >
      {icon}
    </button>
  );
}
