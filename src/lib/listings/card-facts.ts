import { isLandType } from "@/lib/domain/listing-fields";
import { formatArea, formatDecimal, formatKMAmount } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import type { ListingSummary } from "./summary";

export function cardFacts(listing: ListingSummary): string[] {
  if (isLandType(listing.type)) {
    const facts = listing.landAreaM2 !== null ? [formatArea(listing.landAreaM2)] : [];
    if (listing.landAreaM2 && listing.priceKm !== null && !listing.priceNegotiable) {
      facts.push(bs.listing.pricePerSquareMetreShort(formatKMAmount(Math.round(listing.priceKm / listing.landAreaM2))));
    }
    return facts;
  }
  const facts: string[] = [];
  if (listing.areaM2 !== null) {
    facts.push(formatArea(listing.areaM2));
  }
  if (listing.rooms !== null) {
    facts.push(bs.listing.rooms(listing.rooms, formatDecimal(listing.rooms)));
  }
  if (listing.floor !== null) {
    facts.push(bs.listing.floorShort(listing.floor, listing.totalFloors));
  } else if (listing.landAreaM2 !== null) {
    facts.push(bs.listing.landShort(formatArea(listing.landAreaM2)));
  }
  return facts.slice(0, 3);
}
