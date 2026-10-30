import { municipalityOutline } from "@/lib/geo/canton-svg";
import { formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { cardFacts } from "@/lib/listings/card-facts";
import { stampFor } from "@/lib/listings/listing-view";
import type { PublicListingBundle } from "@/lib/listings/public-listing";
import { listingPriceLabel } from "@/lib/seo/listing-title";
import { ogColours as c } from "@/lib/seo/og-fonts";

const stampColours = { uknjizeno: c.vranica, prodano: c.crijep, novo: c.vrbas, istice: c.crijep } as const;

export function ListingOgCard({ bundle }: { bundle: PublicListingBundle }) {
  const { listing } = bundle;
  const stamp = stampFor({ status: listing.status, isRegistered: listing.is_registered, publishedAt: listing.published_at });
  const facts = cardFacts({
    id: listing.id,
    number: listing.number,
    title: listing.title,
    type: listing.type,
    status: listing.status,
    priceKm: listing.price_km,
    priceNegotiable: listing.price_negotiable,
    areaM2: listing.area_m2,
    landAreaM2: listing.land_area_m2,
    rooms: listing.rooms,
    floor: listing.floor,
    totalFloors: listing.total_floors,
    neighborhood: listing.neighborhood,
    isRegistered: listing.is_registered,
    publishedAt: listing.published_at,
    publicLat: listing.public_lat,
    publicLng: listing.public_lng,
    locationPrecise: listing.location_precise,
    municipalityName: bundle.municipalityName,
    municipalitySlug: bundle.municipalitySlug,
    coverUrl: null,
    path: bundle.path,
  });
  const outline = bundle.municipalitySlug ? municipalityOutline(bundle.municipalitySlug, 420, 470, 30) : null;
  const pin = outline && listing.public_lat !== null && listing.public_lng !== null ? outline.project(listing.public_lat, listing.public_lng) : null;
  const location = bundle.municipalityName ? bs.listing.locationLine(bundle.municipalityName, listing.neighborhood) : "";

  return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.papir, color: c.tinta }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 740, padding: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, borderTop: `4px solid ${c.tinta}`, paddingTop: 24 }}>
            <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 24, color: c.tinta2 }}>
              {`${formatListingNumber(listing.number)}${location ? ` · ${location}` : ""}`}
            </div>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 58, lineHeight: 1.1, maxHeight: 200, overflow: "hidden" }}>
              {listing.title}
            </div>
            {stamp ? (
              <div style={{ display: "flex" }}>
                <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontWeight: 600, fontSize: 24, letterSpacing: 3, color: stampColours[stamp], border: `3px solid ${stampColours[stamp]}`, padding: "8px 14px", transform: "rotate(-3deg)" }}>
                  {bs.enums.stamp[stamp].toUpperCase()}
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, fontFamily: "JetBrains Mono", fontWeight: 600, fontSize: 64, color: c.crijep }}>
              {listingPriceLabel(listing.price_km, listing.price_negotiable)}
            </div>
            {facts.length > 0 ? (
              <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 26, color: c.tinta2 }}>{facts.join(" · ")}</div>
            ) : null}
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 34, marginTop: 8 }}>
              {bs.site.name}
              <span style={{ color: c.crijep }}>.</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", borderLeft: `2px solid ${c.linija}`, background: c.papir2 }}>
          {outline ? (
            <svg viewBox={`0 0 ${outline.width} ${outline.height}`} width={outline.width} height={outline.height}>
              <path d={outline.path} fill={c.papir} stroke={c.tinta2} strokeWidth={2} />
              {pin ? (
                listing.location_precise ? (
                  <rect x={pin[0] - 10} y={pin[1] - 10} width={20} height={20} fill={c.crijep} stroke={c.papir} strokeWidth={4} />
                ) : (
                  <circle cx={pin[0]} cy={pin[1]} r={22} fill="rgba(181,72,43,0.15)" stroke={c.crijep} strokeWidth={3} strokeDasharray="6 4" />
                )
              ) : null}
            </svg>
          ) : null}
        </div>
      </div>
  );
}
