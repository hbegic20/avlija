import { isLandType } from "@/lib/domain/listing-fields";
import type { PropertyType } from "@/lib/domain/enums";
import { formatArea, formatKM } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";

export type ListingTitleInput = {
  type: PropertyType;
  areaM2: number | null;
  landAreaM2: number | null;
  municipalityName: string | null;
  priceKm: number | null;
  priceNegotiable: boolean;
};

export function listingPriceLabel(priceKm: number | null, priceNegotiable: boolean): string {
  return priceKm !== null && !priceNegotiable ? formatKM(priceKm) : bs.price.negotiable;
}

export function listingSeoTitle(listing: ListingTitleInput): string {
  const area = isLandType(listing.type) ? listing.landAreaM2 : listing.areaM2;
  const parts = [
    bs.enums.propertyType[listing.type],
    area !== null ? formatArea(area) : null,
    listing.municipalityName,
  ].filter(Boolean);
  return `${parts.join(", ")} — ${listingPriceLabel(listing.priceKm, listing.priceNegotiable)}`;
}
