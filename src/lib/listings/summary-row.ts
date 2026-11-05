import { listingImagesBucket, publicStorageUrl } from "@/lib/supabase/storage-url";
import { listingPath } from "./listing-path";
import { isNewListing } from "./listing-view";
import { recentPreviousPrice } from "./price-reduction";
import type { ListingSummary } from "./summary";

export const listingSummaryFields =
  "id, number, title, type, status, price_km, price_negotiable, previous_price_km, price_reduced_at, area_m2, land_area_m2, rooms, floor, total_floors, neighborhood, is_registered, published_at, public_lat, public_lng, location_precise, listing_images(storage_path, position)";

export type SummaryRow = {
  id: string;
  number: number;
  title: string;
  type: ListingSummary["type"];
  status: ListingSummary["status"];
  price_km: number | null;
  price_negotiable: boolean;
  previous_price_km: number | null;
  price_reduced_at: string | null;
  area_m2: number | null;
  land_area_m2: number | null;
  rooms: number | null;
  floor: number | null;
  total_floors: number | null;
  neighborhood: string | null;
  is_registered: boolean | null;
  published_at: string | null;
  public_lat: number | null;
  public_lng: number | null;
  location_precise: boolean;
  municipalities: { name: string; slug: string } | null;
  listing_images: { storage_path: string; position: number }[];
};

export function toSummary(row: SummaryRow): ListingSummary {
  const now = Date.now();
  const cover = [...row.listing_images].sort((a, b) => a.position - b.position)[0];
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    type: row.type,
    status: row.status,
    priceKm: row.price_km,
    priceNegotiable: row.price_negotiable,
    previousPriceKm: recentPreviousPrice(row.price_km, row.previous_price_km, row.price_reduced_at, now),
    areaM2: row.area_m2,
    landAreaM2: row.land_area_m2,
    rooms: row.rooms,
    floor: row.floor,
    totalFloors: row.total_floors,
    neighborhood: row.neighborhood,
    isRegistered: row.is_registered,
    publishedAt: row.published_at,
    publicLat: row.public_lat,
    publicLng: row.public_lng,
    locationPrecise: row.location_precise,
    municipalityName: row.municipalities?.name ?? null,
    municipalitySlug: row.municipalities?.slug ?? null,
    coverUrl: cover ? publicStorageUrl(listingImagesBucket, cover.storage_path) : null,
    path: listingPath(row.number, row.title),
    isNew: isNewListing(row.published_at, now),
  };
}
