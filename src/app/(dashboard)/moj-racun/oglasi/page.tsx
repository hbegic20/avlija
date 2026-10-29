import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { formatDate, formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { listingRoutes } from "@/lib/listings/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: bs.myListings.title,
  robots: { index: false, follow: false },
};

export default async function MyListingsPage() {
  const user = await requireUser(listingRoutes.mine);
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("id, number, title, status, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-t-tinta pt-3">
        <h1 className="font-display text-h1">{bs.myListings.title}</h1>
        <Link href={listingRoutes.create} className={buttonStyles()}>
          {bs.myListings.newListing}
        </Link>
      </div>
      {!listings || listings.length === 0 ? (
        <EmptyState
          title={bs.myListings.emptyTitle}
          description={bs.myListings.emptyDescription}
          action={
            <Link href={listingRoutes.create} className={buttonStyles({ variant: "secondary" })}>
              {bs.myListings.newListing}
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-papir-2">
              <tr className="text-label text-tinta-2 uppercase">
                <th scope="col" className="px-4 py-3 font-medium">{bs.myListings.columns.number}</th>
                <th scope="col" className="px-4 py-3 font-medium">{bs.myListings.columns.title}</th>
                <th scope="col" className="px-4 py-3 font-medium">{bs.myListings.columns.status}</th>
                <th scope="col" className="px-4 py-3 font-medium">{bs.myListings.columns.updated}</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">{bs.myListings.edit}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-mono text-tinta-2">{formatListingNumber(listing.number)}</td>
                  <td className="px-4 py-3">{listing.title}</td>
                  <td className="px-4 py-3 text-small">{bs.enums.listingStatus[listing.status]}</td>
                  <td className="px-4 py-3 font-mono text-mono text-tinta-2">{formatDate(listing.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {listing.status === "hidden" ? null : (
                      <Link
                        href={listingRoutes.edit(listing.id)}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        {bs.myListings.edit}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
