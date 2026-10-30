import type { StampVariant } from "@/lib/domain/enums";
import { isLandType } from "@/lib/domain/listing-fields";
import { formatArea, formatDecimal, formatKM } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import type { EditableListing, ListingImage } from "./types";

export type LedgerRow = { label: string; value: string; tone?: "default" | "positive" | "negative" };

export type ListingView = {
  listing: EditableListing;
  images: ListingImage[];
  municipalityName: string | null;
};

const newListingDays = 7;
const dayMs = 86_400_000;

function yesNo(value: boolean | null, label: string): LedgerRow | null {
  if (value === null) {
    return null;
  }
  return { label, value: value ? bs.common.yes : bs.common.no, tone: value ? "positive" : "negative" };
}

function compact(rows: Array<LedgerRow | null>): LedgerRow[] {
  return rows.filter((row): row is LedgerRow => row !== null);
}

export function pricingArea(listing: EditableListing): number | null {
  return isLandType(listing.type) ? listing.land_area_m2 : listing.area_m2;
}

export function basicRows({ listing, municipalityName }: ListingView): LedgerRow[] {
  const area = pricingArea(listing);
  const pricePerSquareMetre =
    listing.price_km !== null && !listing.price_negotiable && area ? Math.round(listing.price_km / area) : null;
  return compact([
    { label: bs.listing.type, value: bs.enums.propertyType[listing.type] },
    municipalityName ? { label: bs.listing.municipality, value: municipalityName } : null,
    listing.area_m2 !== null ? { label: bs.listingForm.details.areaM2, value: formatArea(listing.area_m2) } : null,
    listing.land_area_m2 !== null
      ? {
          label: isLandType(listing.type) ? bs.listingForm.details.landAreaM2Land : bs.listingForm.details.landAreaM2,
          value: formatArea(listing.land_area_m2),
        }
      : null,
    listing.rooms !== null ? { label: bs.listingForm.details.rooms, value: formatDecimal(listing.rooms) } : null,
    listing.bathrooms !== null ? { label: bs.listingForm.details.bathrooms, value: String(listing.bathrooms) } : null,
    listing.floor !== null
      ? { label: bs.listingForm.details.floor, value: bs.listing.floorValue(listing.floor, listing.total_floors) }
      : null,
    pricePerSquareMetre !== null ? { label: bs.listing.pricePerSquareMetre, value: formatKM(pricePerSquareMetre) } : null,
  ]);
}

export function buildingRows({ listing }: ListingView): LedgerRow[] {
  return compact([
    listing.year_built !== null ? { label: bs.listingForm.details.yearBuilt, value: `${listing.year_built}.` } : null,
    listing.total_floors !== null && listing.floor === null
      ? { label: bs.listingForm.details.totalFloors, value: String(listing.total_floors) }
      : null,
    listing.heating ? { label: bs.listingForm.details.heating, value: bs.enums.heating[listing.heating] } : null,
    listing.condition ? { label: bs.listingForm.details.condition, value: bs.enums.condition[listing.condition] } : null,
  ]);
}

export function documentRows({ listing }: ListingView): LedgerRow[] {
  return compact([
    yesNo(listing.is_registered, bs.listingForm.details.isRegistered),
    yesNo(listing.has_building_permit, bs.listingForm.details.hasBuildingPermit),
    yesNo(listing.has_usage_permit, bs.listingForm.details.hasUsagePermit),
  ]);
}

export function featureLabels({ listing }: ListingView): string[] {
  return listing.features.map((feature) => bs.enums.feature[feature as keyof typeof bs.enums.feature] ?? feature);
}

export type StampInput = {
  status: EditableListing["status"];
  isRegistered: boolean | null;
  publishedAt: string | null;
};

export function stampFor(listing: StampInput, now: number = Date.now()): StampVariant | null {
  if (listing.status === "sold") {
    return "prodano";
  }
  if (listing.isRegistered) {
    return "uknjizeno";
  }
  const publishedAt = listing.publishedAt ? new Date(listing.publishedAt).getTime() : null;
  if (publishedAt === null || now - publishedAt < newListingDays * dayMs) {
    return "novo";
  }
  return null;
}
