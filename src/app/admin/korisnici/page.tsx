import type { Metadata } from "next";
import Link from "next/link";
import { HideAllButton } from "@/components/admin/hide-all-button";
import { sellerPath } from "@/components/listings/detail/seller-box";
import { Pagination } from "@/components/ui/pagination";
import { adminRoutes } from "@/lib/admin/routes";
import type { ListingStatus, UserRole } from "@/lib/domain/enums";
import { formatDate, formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { createClient } from "@/lib/supabase/server";
import { HatchNotice } from "@/components/ui/hatch-notice";

export const instant = false;

export const metadata: Metadata = { title: bs.admin.users.title };

const text = bs.admin.users;
const usersPageSize = 50;

type ProfileRow = { id: string; full_name: string; role: UserRole; created_at: string };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/korisnici">) {
  const pageValue = (await searchParams).stranica;
  const page = Math.max(1, Math.floor(Number(Array.isArray(pageValue) ? pageValue[0] : pageValue) || 1));
  const supabase = await createClient();
  const from = (page - 1) * usersPageSize;
  const { data, count } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + usersPageSize - 1);
  const profiles = (data ?? []) as ProfileRow[];

  const { data: listingRows } = profiles.length
    ? await supabase
        .from("listings")
        .select("owner_id, status")
        .in(
          "owner_id",
          profiles.map((profile) => profile.id),
        )
    : { data: [] as Array<{ owner_id: string; status: ListingStatus }> };
  const totals = new Map<string, { all: number; active: number; public: number }>();
  for (const row of listingRows ?? []) {
    const entry = totals.get(row.owner_id) ?? { all: 0, active: 0, public: 0 };
    entry.all += 1;
    entry.active += row.status === "active" ? 1 : 0;
    entry.public += row.status === "active" || row.status === "sold" ? 1 : 0;
    totals.set(row.owner_id, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-h1">{text.title}</h1>
      {profiles.length === 0 ? (
        <HatchNotice>{text.empty}</HatchNotice>
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-papir-2">
              <tr className="text-label text-tinta-2 uppercase">
                <th scope="col" className="px-4 py-3 font-medium">{text.name}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.role}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.joined}</th>
                <th scope="col" className="px-4 py-3 font-medium">{text.listings}</th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const total = totals.get(profile.id) ?? { all: 0, active: 0, public: 0 };
                return (
                  <tr key={profile.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link href={sellerPath(profile.id)} className="underline-offset-3 hover:underline">
                        {profile.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-small">{bs.enums.userRole[profile.role]}</td>
                    <td className="px-4 py-3 font-mono text-mono text-tinta-2">{formatDate(profile.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-mono">
                      {formatInteger(total.active)} {text.active} · {formatInteger(total.all)} {text.total}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {total.public > 0 && profile.role !== "admin" ? (
                        <HideAllButton userId={profile.id} userName={profile.full_name} />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {(count ?? 0) > usersPageSize ? (
        <Pagination
          page={page}
          pageSize={usersPageSize}
          totalItems={count ?? 0}
          hrefForPage={(target) => (target > 1 ? `${adminRoutes.users}?stranica=${target}` : adminRoutes.users)}
        />
      ) : null}
    </div>
  );
}
