import type { Metadata } from "next";
import Link from "next/link";
import { AdminListingActions } from "@/components/admin/admin-listing-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { adminRoutes } from "@/lib/admin/routes";
import { listingStatuses, type ListingStatus } from "@/lib/domain/enums";
import { formatDate, formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { listingPath } from "@/lib/listings/listing-path";
import { createClient } from "@/lib/supabase/server";
import { HatchNotice } from "@/components/ui/hatch-notice";

export const instant = false;

export const metadata: Metadata = { title: bs.admin.listings.title };

const text = bs.admin.listings;
const adminPageSize = 50;

type AdminListingRow = {
  id: string;
  number: number;
  title: string;
  status: ListingStatus;
  created_at: string;
  hidden_reason: string | null;
  owner: { full_name: string } | null;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/oglasi">) {
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 100);
  const statusParam = first(params.status);
  const status = (listingStatuses as readonly string[]).includes(statusParam) ? (statusParam as ListingStatus) : null;
  const page = Math.max(1, Math.floor(Number(first(params.stranica)) || 1));

  const supabase = await createClient();
  let request = supabase
    .from("listings")
    .select("id, number, title, status, created_at, hidden_reason, owner:profiles!listings_owner_id_fkey(full_name)", { count: "exact" });
  if (status) {
    request = request.eq("status", status);
  }
  const numericQuery = query.replace(/^br\.?\s*/i, "");
  if (/^\d{1,9}$/.test(numericQuery)) {
    request = request.eq("number", Number(numericQuery));
  } else if (query) {
    request = request.ilike("title", `%${escapeLike(query)}%`);
  }
  const from = (page - 1) * adminPageSize;
  const { data, count } = await request.order("created_at", { ascending: false }).range(from, from + adminPageSize - 1);
  const listings = (data ?? []) as unknown as AdminListingRow[];

  const hrefForPage = (target: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    if (target > 1) next.set("stranica", String(target));
    const value = next.toString();
    return value ? `${adminRoutes.listings}?${value}` : adminRoutes.listings;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-h1">{text.title}</h1>
      <form action={adminRoutes.listings} method="get" className="flex flex-wrap items-end gap-3 border bg-papir-2 p-4">
        <Input
          label={text.search}
          name="q"
          type="search"
          defaultValue={query}
          placeholder={text.searchPlaceholder}
          fieldClassName="min-w-56 flex-1"
        />
        <Select
          label={text.status}
          name="status"
          placeholder={text.allStatuses}
          defaultValue={status ?? ""}
          options={listingStatuses.map((entry) => ({ value: entry, label: bs.enums.listingStatus[entry] }))}
          fieldClassName="w-48"
        />
        <Button type="submit" variant="secondary">
          {text.filter}
        </Button>
      </form>

      {listings.length === 0 ? (
        <HatchNotice>{text.empty}</HatchNotice>
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-papir-2">
              <tr className="text-label text-tinta-2 uppercase">
                <th scope="col" className="px-4 py-3 font-medium">{text.number}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.listingTitle}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.owner}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.status}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.created}</th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-t align-top">
                  <td className="px-4 py-3 font-mono text-mono text-tinta-2">{formatListingNumber(listing.number)}</td>
                  <td className="px-4 py-3">
                    {listing.status === "active" || listing.status === "sold" ? (
                      <Link href={listingPath(listing.number, listing.title)} className="underline-offset-3 hover:underline">
                        {listing.title}
                      </Link>
                    ) : (
                      listing.title
                    )}
                    {listing.hidden_reason ? (
                      <p className="mt-1 text-small text-greska">{listing.hidden_reason}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-small">{listing.owner?.full_name ?? ""}</td>
                  <td className="px-4 py-3 text-small">{bs.enums.listingStatus[listing.status]}</td>
                  <td className="px-4 py-3 font-mono text-mono text-tinta-2">{formatDate(listing.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <AdminListingActions
                      listingId={listing.id}
                      listingNumber={formatListingNumber(listing.number)}
                      status={listing.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(count ?? 0) > adminPageSize ? (
        <Pagination page={page} pageSize={adminPageSize} totalItems={count ?? 0} hrefForPage={hrefForPage} />
      ) : null}
    </div>
  );
}
