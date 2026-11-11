import type { ListingStatus } from "@/lib/domain/enums";

type HiddenListing = { expires_at: string | null; sold_at: string | null };

export function statusAfterUnhide(listing: HiddenListing, now: number): ListingStatus {
  if (listing.sold_at !== null) {
    return "sold";
  }
  const stillValid = listing.expires_at !== null && new Date(listing.expires_at).getTime() > now;
  return stillValid ? "active" : "archived";
}
