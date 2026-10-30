import { listingImagesBucket, publicStorageUrl } from "@/lib/supabase/storage-url";
import type { ListingImage } from "./types";

export const listingImageColumns = "id, storage_path, position, width, height";

export type ListingImageRecord = {
  id: string;
  storage_path: string;
  position: number;
  width: number | null;
  height: number | null;
};

export function toListingImage(row: ListingImageRecord): ListingImage {
  return {
    id: row.id,
    storagePath: row.storage_path,
    publicUrl: publicStorageUrl(listingImagesBucket, row.storage_path),
    position: row.position,
    width: row.width,
    height: row.height,
  };
}
