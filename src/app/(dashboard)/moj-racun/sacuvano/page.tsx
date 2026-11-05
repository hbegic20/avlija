import type { Metadata } from "next";
import Link from "next/link";
import { ListingSheet } from "@/components/listings/listing-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireUser } from "@/lib/auth/current-user";
import { favoritesRoutes } from "@/lib/favorites/routes";
import { bs } from "@/lib/i18n/bs";
import type { ListingSummary } from "@/lib/listings/summary";
import { listingSummaryFields, toSummary, type SummaryRow } from "@/lib/listings/summary-row";
import { pageHref, parsePageParam } from "@/lib/pagination/page-param";
import { listingsBasePath, pageSize } from "@/lib/search/filters";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: bs.favorites.title,
  robots: { index: false, follow: false },
};

const favoriteListingColumns = `created_at, listings!inner(${listingSummaryFields}, municipalities(name, slug))`;

async function loadFavorites(userId: string, page: number): Promise<{ items: ListingSummary[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const { data, count } = await supabase
    .from("favorites")
    .select(favoriteListingColumns, { count: "exact" })
    .eq("user_id", userId)
    .in("listings.status", ["active", "sold"])
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "listings.listing_images" })
    .limit(1, { referencedTable: "listings.listing_images" })
    .range(from, from + pageSize - 1);

  const rows: SummaryRow[] = (data ?? []).map((row) => row.listings);
  const items = rows.map(toSummary);
  return { items, total: count ?? 0 };
}

export default async function FavoritesPage({ searchParams }: PageProps<"/moj-racun/sacuvano">) {
  const user = await requireUser(favoritesRoutes.page);
  const page = parsePageParam(await searchParams);
  const { items: favorites, total } = await loadFavorites(user.id, page);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-t-2 border-t-tinta pt-3">
        <h1 className="font-display text-h1">{bs.favorites.title}</h1>
        <p className="max-w-[60ch] text-tinta-2">{bs.favorites.description}</p>
      </header>
      {total === 0 ? (
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
        <>
          <ListingSheet listings={favorites} eagerCount={4} />
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            hrefForPage={(target) => pageHref(favoritesRoutes.page, target)}
          />
        </>
      )}
    </div>
  );
}
