import type { Metadata } from "next";
import Link from "next/link";
import { ListingSheet } from "@/components/listings/listing-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { favoritesRoutes } from "@/lib/favorites/routes";
import { bs } from "@/lib/i18n/bs";
import type { ListingSummary } from "@/lib/listings/summary";
import { listingsBasePath } from "@/lib/search/filters";
import { toSummary, type SummaryRow } from "@/lib/search/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: bs.favorites.title,
  robots: { index: false, follow: false },
};

const favoriteListingColumns =
  "created_at, listings(id, number, title, type, status, price_km, price_negotiable, area_m2, land_area_m2, rooms, floor, total_floors, neighborhood, is_registered, published_at, public_lat, public_lng, location_precise, municipalities(name, slug), listing_images(storage_path, position))";

async function loadFavorites(userId: string): Promise<ListingSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select(favoriteListingColumns)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "listings.listing_images" })
    .limit(1, { referencedTable: "listings.listing_images" });

  return ((data ?? []) as unknown as Array<{ listings: SummaryRow | null }>)
    .map((row) => row.listings)
    .filter((listing): listing is SummaryRow => listing !== null && (listing.status === "active" || listing.status === "sold"))
    .map(toSummary);
}

export default async function FavoritesPage() {
  const user = await requireUser(favoritesRoutes.page);
  const favorites = await loadFavorites(user.id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-t-2 border-t-tinta pt-3">
        <h1 className="font-display text-h1">{bs.favorites.title}</h1>
        <p className="max-w-[60ch] text-tinta-2">{bs.favorites.description}</p>
      </header>
      {favorites.length === 0 ? (
        <EmptyState
          title={bs.favorites.emptyTitle}
          description={bs.favorites.emptyDescription}
          action={
            <Link href={listingsBasePath} className={buttonStyles({ variant: "secondary" })}>
              {bs.favorites.browse}
            </Link>
          }
        />
      ) : (
        <ListingSheet listings={favorites} priorityCount={4} />
      )}
    </div>
  );
}
