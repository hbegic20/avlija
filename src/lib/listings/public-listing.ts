import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { listingsCacheTag } from "@/lib/search/cache-tags";
import { createPublicClient, publicStorageUrl } from "@/lib/supabase/public";
import { listingPath } from "./listing-path";
import { isNewListing } from "./listing-view";
import { isGoneSoldListing } from "./sold-grace";
import type { EditableListing, ListingImage } from "./types";

const publicListingColumns =
  "id, number, owner_id, status, type, title, description, price_km, price_negotiable, municipality_id, neighborhood, location_precise, area_m2, land_area_m2, rooms, bathrooms, floor, total_floors, year_built, heating, condition, is_registered, has_building_permit, has_usage_permit, features, view_count, published_at, expires_at, sold_at, hidden_reason, created_at, updated_at, public_lat, public_lng, public_address, main_area_m2, price_per_m2";

export type PublicSeller = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  memberSince: string;
};

export type PublicListingBundle = {
  listing: EditableListing;
  images: ListingImage[];
  municipalityName: string | null;
  municipalitySlug: string | null;
  seller: PublicSeller | null;
  path: string;
  isNew: boolean;
};

export function listingCacheTag(listingNumber: number): string {
  return `listing-${listingNumber}`;
}

export async function getPublicListing(listingNumber: number): Promise<PublicListingBundle | null> {
  "use cache";
  cacheTag(listingsCacheTag, listingCacheTag(listingNumber));
  cacheLife("minutes");

  const client = createPublicClient();
  const { data: row } = await client
    .from("listings")
    .select(publicListingColumns)
    .eq("number", listingNumber)
    .in("status", ["active", "sold"])
    .maybeSingle();
  if (!row || isGoneSoldListing(row.status, row.sold_at, Date.now())) {
    return null;
  }

  const [{ data: imageRows }, { data: municipality }, { data: profile }] = await Promise.all([
    client
      .from("listing_images")
      .select("id, storage_path, position, width, height")
      .eq("listing_id", row.id)
      .order("position"),
    row.municipality_id
      ? client.from("municipalities").select("name, slug").eq("id", row.municipality_id).maybeSingle()
      : Promise.resolve({ data: null }),
    client.from("profiles").select("id, full_name, avatar_url, created_at").eq("id", row.owner_id).maybeSingle(),
  ]);

  return {
    listing: { ...row, lat: null, lng: null, address: null },
    images: (imageRows ?? []).map((image) => ({
      id: image.id,
      storagePath: image.storage_path,
      publicUrl: publicStorageUrl("listing-images", image.storage_path),
      position: image.position,
      width: image.width,
      height: image.height,
    })),
    municipalityName: municipality?.name ?? null,
    municipalitySlug: municipality?.slug ?? null,
    seller: profile
      ? {
          id: profile.id,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          memberSince: profile.created_at,
        }
      : null,
    path: listingPath(row.number, row.title),
    isNew: isNewListing(row.published_at, Date.now()),
  };
}

export async function getPublicSeller(sellerId: string): Promise<PublicSeller | null> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife("minutes");

  const { data } = await createPublicClient()
    .from("profiles")
    .select("id, full_name, avatar_url, created_at")
    .eq("id", sellerId)
    .maybeSingle();
  return data
    ? { id: data.id, fullName: data.full_name, avatarUrl: data.avatar_url, memberSince: data.created_at }
    : null;
}

export { parseListingSegment } from "./public-listing-segment";
