import Image from "next/image";
import Link from "next/link";
import { FavoriteHeart } from "@/components/favorites/favorite-heart";
import { PriceTag } from "@/components/ui/price-tag";
import { Stamp } from "@/components/ui/stamp";
import { cn } from "@/lib/cn";
import { formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { cardFacts } from "@/lib/listings/card-facts";
import { stampFor } from "@/lib/listings/listing-view";
import type { ListingSummary } from "@/lib/listings/summary";

function ListingCard({
  listing,
  eager = false,
  className,
}: {
  listing: ListingSummary;
  eager?: boolean;
  className?: string;
}) {
  const stamp = stampFor(listing);
  const facts = cardFacts(listing);
  const location = listing.municipalityName ? bs.listing.locationLine(listing.municipalityName, listing.neighborhood) : null;

  return (
    <div className={cn("group relative h-full bg-papir text-tinta transition-colors hover:bg-papir-2", className)}>
      <Link href={listing.path} className="flex h-full flex-col">
        <div className="relative aspect-4/3 overflow-hidden border-b">
          {listing.coverUrl ? (
            <Image
              src={listing.coverUrl}
              alt={`${bs.enums.propertyType[listing.type]}, ${listing.municipalityName ?? ""}`}
              fill
              sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, (min-width: 520px) 50vw, 100vw"
              className="object-cover"
              loading={eager ? "eager" : "lazy"}
            />
          ) : (
            <div className="hatch size-full" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3.5 pb-4.5">
          <p className="truncate font-mono text-label tracking-[0.02em] text-tinta-2">
            {formatListingNumber(listing.number)}
            {location ? ` · ${location}` : null}
          </p>
          <h3 className="line-clamp-2 font-display text-h3 underline-offset-3 group-hover:underline">{listing.title}</h3>
          <PriceTag priceKm={listing.priceKm} negotiable={listing.priceNegotiable} className="mt-auto pt-1" />
          {facts.length > 0 ? <p className="font-mono text-mono text-tinta-2">{facts.join(" · ")}</p> : null}
        </div>
      </Link>
      {stamp ? <Stamp variant={stamp} className="pointer-events-none absolute top-3.5 left-3.5" /> : null}
      <FavoriteHeart listingId={listing.id} title={listing.title} className="absolute top-2.5 right-2.5" />
    </div>
  );
}

export function ListingSheet({ listings, eagerCount = 0 }: { listings: ListingSummary[]; eagerCount?: number }) {
  return (
    <ul className="grid grid-cols-1 border-t border-l min-[520px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing, index) => (
        <li key={listing.id} className="border-r border-b bg-papir">
          <ListingCard listing={listing} eager={index < eagerCount} />
        </li>
      ))}
    </ul>
  );
}
