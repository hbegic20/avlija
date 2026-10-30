import Link from "next/link";
import { adminRoutes } from "@/lib/admin/routes";
import { formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const count = async (query: PromiseLike<{ count: number | null }>) => (await query).count ?? 0;
  const [openReports, activeListings, hiddenListings, users] = await Promise.all([
    count(supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open")),
    count(supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active")),
    count(supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "hidden")),
    count(supabase.from("profiles").select("id", { count: "exact", head: true })),
  ]);

  const stats = [
    { label: bs.admin.stats.openReports, value: openReports, href: adminRoutes.reports },
    { label: bs.admin.stats.activeListings, value: activeListings, href: `${adminRoutes.listings}?status=active` },
    { label: bs.admin.stats.hiddenListings, value: hiddenListings, href: `${adminRoutes.listings}?status=hidden` },
    { label: bs.admin.stats.users, value: users, href: adminRoutes.users },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-h1">{bs.admin.nav.overview}</h1>
      <ul className="grid grid-cols-2 border-t border-l lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className="border-r border-b">
            <Link href={stat.href} className="flex h-full flex-col gap-1 bg-papir p-5 transition-colors hover:bg-papir-2">
              <span className="text-label text-tinta-2 uppercase">{stat.label}</span>
              <span className="font-mono text-price text-tinta">{formatInteger(stat.value)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
