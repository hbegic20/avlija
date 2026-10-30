import Image from "next/image";
import type { ReactNode } from "react";
import { DataRow } from "@/components/ui/data-row";
import { PriceTag } from "@/components/ui/price-tag";
import { Stamp } from "@/components/ui/stamp";
import type { StampVariant } from "@/lib/domain/enums";
import { formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { cardFacts } from "@/lib/listings/card-facts";
import type { ListingSummary } from "@/lib/listings/summary";

export function ListingRow({
  listing,
  stamp,
  facts,
  notice,
  actions,
}: {
  listing: ListingSummary;
  stamp: StampVariant | null;
  facts: Array<{ label: string; value: string; tone?: "default" | "positive" | "negative" }>;
  notice?: ReactNode;
  actions: ReactNode;
}) {
  const location = listing.municipalityName ? bs.listing.locationLine(listing.municipalityName, listing.neighborhood) : null;
  const inlineFacts = cardFacts(listing);

  return (
    <article className="grid gap-4 bg-papir p-4 md:grid-cols-[120px_1fr_auto] md:items-start md:gap-6">
      <div className="relative aspect-4/3 w-full max-w-[200px] overflow-hidden border md:w-[120px]">
        {listing.coverUrl ? (
          <Image src={listing.coverUrl} alt="" fill sizes="(min-width: 768px) 120px, 200px" className="object-cover" />
        ) : (
          <div className="hatch size-full" aria-hidden="true" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-label text-tinta-2">
            {formatListingNumber(listing.number)}
            {location ? ` · ${location}` : null}
          </p>
          {stamp ? <Stamp variant={stamp} className="scale-90" /> : null}
        </div>
        <h2 className="font-display text-h3">{listing.title}</h2>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <PriceTag priceKm={listing.priceKm} negotiable={listing.priceNegotiable} />
          {inlineFacts.length > 0 ? <p className="font-mono text-mono text-tinta-2">{inlineFacts.join(" · ")}</p> : null}
        </div>
        <dl className="grid max-w-md gap-x-6 sm:grid-cols-2">
          {facts.map((fact) => (
            <DataRow key={fact.label} label={fact.label} value={fact.value} tone={fact.tone} />
          ))}
        </dl>
        {notice}
      </div>
      <div className="md:max-w-[300px]">{actions}</div>
    </article>
  );
}
