import type { ReactNode } from "react";
import { LazyLocationMap } from "@/components/map/lazy-maps";
import { DataRow } from "@/components/ui/data-row";
import { Ledger } from "@/components/ui/ledger";
import { PriceTag } from "@/components/ui/price-tag";
import { Stamp } from "@/components/ui/stamp";
import { Tag } from "@/components/ui/tag";
import { formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import {
  basicRows,
  buildingRows,
  documentRows,
  featureLabels,
  pricingArea,
  stampFor,
  type LedgerRow,
  type ListingView,
} from "@/lib/listings/listing-view";
import { ListingGallery } from "./listing-gallery";

function LedgerSection({ title, rows }: { title: string; rows: LedgerRow[] }) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <Ledger title={title}>
      {rows.map((row) => (
        <DataRow key={row.label} label={row.label} value={row.value} tone={row.tone} />
      ))}
    </Ledger>
  );
}

export function ListingDetailView({
  view,
  aside,
  afterHeader,
}: {
  view: ListingView;
  aside?: ReactNode;
  afterHeader?: ReactNode;
}) {
  const { listing, images, municipalityName } = view;
  const stamp = stampFor({
    status: listing.status,
    isRegistered: listing.is_registered,
    publishedAt: listing.published_at,
  });
  const features = featureLabels(view);

  return (
    <article className="flex flex-col gap-8">
      <div className="relative">
        <ListingGallery images={images} title={listing.title} />
        {stamp ? <Stamp variant={stamp} className="absolute top-4 left-4" /> : null}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-3">
            <p className="font-mono text-mono text-tinta-2">
              {formatListingNumber(listing.number)}
              {municipalityName ? ` · ${bs.listing.locationLine(municipalityName, listing.neighborhood)}` : null}
            </p>
            <h1 className="font-display text-h1">{listing.title}</h1>
            {afterHeader}
          </header>

          <div className="grid gap-8 md:grid-cols-2">
            <LedgerSection title={bs.listing.sections.basic} rows={basicRows(view)} />
            <LedgerSection title={bs.listing.sections.building} rows={buildingRows(view)} />
            <LedgerSection title={bs.listing.sections.documents} rows={documentRows(view)} />
          </div>

          {features.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-label text-tinta-2 uppercase">{bs.listing.sections.features}</h2>
              <ul className="flex flex-wrap gap-2">
                {features.map((feature) => (
                  <li key={feature}>
                    <Tag>{feature}</Tag>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {listing.description ? (
            <section className="flex flex-col gap-3">
              <h2 className="border-t-2 border-t-tinta pt-3 font-display text-h2">{bs.listing.sections.description}</h2>
              <p className="max-w-[70ch] whitespace-pre-line">{listing.description}</p>
            </section>
          ) : null}

          {listing.public_lat !== null && listing.public_lng !== null ? (
            <section className="flex flex-col gap-3">
              <h2 className="border-t-2 border-t-tinta pt-3 font-display text-h2">{bs.listing.sections.location}</h2>
              <p className="text-small text-tinta-2">
                {listing.location_precise ? bs.listing.exactLocation : bs.listing.approximateLocation}
                {listing.public_address ? ` · ${listing.public_address}` : null}
              </p>
              <LazyLocationMap lat={listing.public_lat} lng={listing.public_lng} precise={listing.location_precise} />
              {listing.location_precise ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${listing.public_lat},${listing.public_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-small font-medium text-vranica underline underline-offset-3 hover:text-crijep"
                >
                  {bs.detail.openInGoogleMaps}
                </a>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-col gap-4 border bg-papir-2 p-5">
            <PriceTag priceKm={listing.price_km} negotiable={listing.price_negotiable} areaM2={pricingArea(listing)} />
          </div>
          {aside}
        </aside>
      </div>
    </article>
  );
}
