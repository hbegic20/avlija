"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import { adminRoutes } from "@/lib/admin/routes";

const links = [
  { href: adminRoutes.overview, label: bs.admin.nav.overview },
  { href: adminRoutes.reports, label: bs.admin.nav.reports },
  { href: adminRoutes.listings, label: bs.admin.nav.listings },
  { href: adminRoutes.users, label: bs.admin.nav.users },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={bs.admin.nav.label} className="overflow-x-auto">
      <ul className="flex min-w-max border-b">
        {links.map((link) => {
          const active = link.href === adminRoutes.overview ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 px-4 py-3 text-small font-medium transition-colors",
                  active ? "border-b-crijep text-tinta" : "border-b-transparent text-tinta-2 hover:text-tinta",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
