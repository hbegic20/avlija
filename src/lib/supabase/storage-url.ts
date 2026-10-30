import { supabaseUrl } from "./env";

export const listingImagesBucket = "listing-images";
export const avatarsBucket = "avatars";

export function publicStorageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
