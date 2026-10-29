import type { Metadata } from "next";
import Link from "next/link";
import { accountLinks } from "@/components/layout/account-links";
import { requireUser } from "@/lib/auth/current-user";
import { authRoutes } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";

export const metadata: Metadata = {
  title: bs.account.menu,
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await requireUser(authRoutes.dashboard);

  return (
    <section>
      <h1 className="border-t-2 border-t-tinta pt-3 font-display text-h1">{bs.account.welcome(user.fullName)}</h1>
      <p className="mt-3 max-w-[60ch] text-tinta-2">{bs.account.dashboardIntro}</p>
      <ul className="mt-8 grid gap-px border bg-linija sm:grid-cols-2 lg:grid-cols-4">
        {accountLinks.slice(1).map((link) => (
          <li key={link.href} className="bg-papir">
            <Link href={link.href} className="block p-5 font-display text-h3 transition-colors hover:bg-papir-2 hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
