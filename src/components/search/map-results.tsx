"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LazyListingsMap } from "@/components/map/lazy-maps";
import { PriceTag } from "@/components/ui/price-tag";
import { formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { cardFacts } from "@/lib/listings/card-facts";
import type { ListingPin, ListingSummary } from "@/lib/listings/summary";

function ResultRow({
  listing,
  onHover,
}: {
  listing: ListingSummary;
  onHover: (id: string | null) => void;
}) {
  return (
    <Link
      href={listing.path}
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(listing.id)}
      onBlur={() => onHover(null)}
      className="group flex h-full gap-3 bg-papir p-3 transition-colors hover:bg-papir-2"
    >
      <div className="relative aspect-4/3 w-28 shrink-0 overflow-hidden border">
        {listing.coverUrl ? (
          <Image src={listing.coverUrl} alt="" fill sizes="112px" className="object-cover" />
        ) : (
          <div className="hatch size-full" aria-hidden="true" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate font-mono text-label text-tinta-2">
          {formatListingNumber(listing.number)}
          {listing.municipalityName ? ` · ${listing.municipalityName}` : null}
        </p>
        <p className="line-clamp-2 font-display text-body font-semibold underline-offset-3 group-hover:underline">
          {listing.title}
        </p>
        <PriceTag priceKm={listing.priceKm} negotiable={listing.priceNegotiable} className="[&_p:first-child]:text-body" />
        <p className="truncate font-mono text-label text-tinta-2">{cardFacts(listing).join(" · ")}</p>
      </div>
    </Link>
  );
}

export function MapResults({ listings, pins }: { listings: ListingSummary[]; pins: ListingPin[] }) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  return (
    <div className="relative -mx-4 h-[calc(100dvh-8rem)] min-h-[480px] md:mx-0 lg:grid lg:h-[calc(100dvh-6rem)] lg:grid-cols-[380px_1fr] lg:border">
      <div className="absolute inset-0 lg:static lg:order-2">
        <LazyListingsMap pins={pins} highlightedId={highlightedId} />
      </div>
      <ul
        aria-label={bs.search.title}
        className="absolute inset-x-0 bottom-0 z-[500] flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 lg:static lg:order-1 lg:z-auto lg:flex-col lg:gap-0 lg:divide-y lg:overflow-y-auto lg:border-r lg:px-0 lg:pb-0"
      >
        {listings.map((listing) => (
          <li key={listing.id} className="w-[85%] max-w-sm shrink-0 snap-start border lg:w-auto lg:max-w-none lg:border-0">
            <ResultRow listing={listing} onHover={setHighlightedId} />
          </li>
        ))}
      </ul>
    </div>
  );
}
