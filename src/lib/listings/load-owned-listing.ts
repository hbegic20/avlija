import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EditableListing, ListingImage, MunicipalityRow } from "./types";

export const listingImagesBucket = "listing-images";

const editableColumns =
  "id, number, owner_id, status, type, title, description, price_km, price_negotiable, municipality_id, neighborhood, address, lat, lng, location_precise, area_m2, land_area_m2, rooms, bathrooms, floor, total_floors, year_built, heating, condition, is_registered, has_building_permit, has_usage_permit, features, view_count, published_at, expires_at, sold_at, hidden_reason, created_at, updated_at";

export type OwnedListingBundle = {
  listing: EditableListing;
  images: ListingImage[];
};

export async function loadOwnedListing(listingId: string, ownerId: string): Promise<OwnedListingBundle | null> {
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select(editableColumns)
    .eq("id", listingId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!listing) {
    return null;
  }
  const { data: imageRows } = await supabase
    .from("listing_images")
    .select("id, storage_path, position, width, height")
    .eq("listing_id", listingId)
    .order("position");

  const images = (imageRows ?? []).map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    publicUrl: supabase.storage.from(listingImagesBucket).getPublicUrl(row.storage_path).data.publicUrl,
    position: row.position,
    width: row.width,
    height: row.height,
  }));

  return { listing, images };
}

export async function loadMunicipalities(): Promise<MunicipalityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("municipalities").select("id, slug, name, lat, lng").order("name");
  return data ?? [];
}
