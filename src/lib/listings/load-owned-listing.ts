import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listingImageColumns, toListingImage } from "./listing-image";
import { isNewListing } from "./listing-view";
import type { EditableListing, ListingImage, MunicipalityRow } from "./types";

const publicColumns =
  "id, number, owner_id, status, type, title, description, price_km, price_negotiable, municipality_id, neighborhood, location_precise, area_m2, land_area_m2, rooms, bathrooms, floor, total_floors, year_built, heating, condition, is_registered, has_building_permit, has_usage_permit, features, view_count, published_at, expires_at, sold_at, hidden_reason, created_at, updated_at, public_lat, public_lng, public_address, main_area_m2, price_per_m2";

export type OwnedListingBundle = {
  listing: EditableListing;
  images: ListingImage[];
  isNew: boolean;
};

export async function loadOwnedListing(listingId: string, ownerId: string): Promise<OwnedListingBundle | null> {
  const supabase = await createClient();
  const { data: publicListing } = await supabase
    .from("listings")
    .select(publicColumns)
    .eq("id", listingId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!publicListing) {
    return null;
  }
  const { data: privateLocation } = await supabase.rpc("get_listing_private_location", {
    target_listing_id: listingId,
  });
  const exact = privateLocation?.[0];
  const listing: EditableListing = {
    ...publicListing,
    lat: exact?.lat ?? null,
    lng: exact?.lng ?? null,
    address: exact?.address ?? null,
  };
  const { data: imageRows } = await supabase
    .from("listing_images")
    .select(listingImageColumns)
    .eq("listing_id", listingId)
    .order("position");
  const images = (imageRows ?? []).map(toListingImage);

  return { listing, images, isNew: isNewListing(listing.published_at, Date.now()) };
}

export async function loadMunicipalities(): Promise<MunicipalityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("municipalities").select("id, slug, name, lat, lng").order("name");
  return data ?? [];
}
