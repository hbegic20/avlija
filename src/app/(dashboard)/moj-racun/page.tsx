import type { Metadata } from "next";
import Link from "next/link";
import { accountLinks } from "@/components/layout/account-links";
import { PhoneRequiredNotice } from "@/components/profile/phone-required-notice";
import { buttonStyles } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/current-user";
import { authRoutes } from "@/lib/auth/routes";
import { formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { loadDashboardSummary } from "@/lib/listings/my-listings";
import { listingRoutes } from "@/lib/listings/routes";
import { hasPhone } from "@/lib/profile/has-phone";

export const metadata: Metadata = {
  title: bs.account.menu,
  robots: { index: false, follow: false },
};

const text = bs.dashboard;

function Notice({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return (
    <section className="flex flex-col items-start gap-3 border border-l-4 border-l-upozorenje bg-papir-2 p-5">
      <h2 className="font-display text-h3">{title}</h2>
      <p className="text-small text-tinta-2">{body}</p>
      <Link href={href} className={buttonStyles({ variant: "secondary", size: "sm" })}>
        {action}
      </Link>
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser(authRoutes.dashboard);
  const [summary, phoneSet] = await Promise.all([loadDashboardSummary(user.id), hasPhone(user.id)]);
  const { counts, totalViews, expiringCount } = summary;
  const profileIncomplete = !summary.avatarUrl || !summary.municipalityId;

  const stats = [
    { label: text.stats.active, value: counts.active, href: listingRoutes.mine },
    { label: text.stats.drafts, value: counts.draft, href: `${listingRoutes.mine}?status=nacrti` },
    { label: text.stats.sold, value: counts.sold, href: `${listingRoutes.mine}?status=prodani` },
    { label: text.stats.archived, value: counts.archived, href: `${listingRoutes.mine}?status=arhivirani` },
    { label: text.stats.views, value: totalViews, href: listingRoutes.mine },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-t-tinta pt-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-h1">{bs.account.welcome(user.fullName)}</h1>
          <p className="max-w-[60ch] text-tinta-2">{bs.account.dashboardIntro}</p>
        </div>
        <Link href={listingRoutes.create} className={buttonStyles()}>
          {bs.myListings.newListing}
        </Link>
      </div>

      <ul className="grid grid-cols-2 border-t border-l sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <li key={stat.label} className="border-r border-b">
            <Link href={stat.href} className="flex h-full flex-col gap-1 bg-papir p-5 transition-colors hover:bg-papir-2">
              <span className="text-label text-tinta-2 uppercase">{stat.label}</span>
              <span className="font-mono text-price text-tinta">{formatInteger(stat.value)}</span>
            </Link>
          </li>
        ))}
      </ul>

      {expiringCount > 0 || !phoneSet || profileIncomplete ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {expiringCount > 0 ? (
            <Notice
              title={text.expiringTitle}
              body={text.expiringText(expiringCount)}
              href={listingRoutes.mine}
              action={text.expiringAction}
            />
          ) : null}
          {!phoneSet ? <PhoneRequiredNotice /> : null}
          {phoneSet && profileIncomplete ? (
            <Notice
              title={text.profileTitle}
              body={text.profileText}
              href={authRoutes.profile}
              action={text.profileAction}
            />
          ) : null}
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-label text-tinta-2 uppercase">{text.shortcuts}</h2>
        <ul className="grid gap-px border bg-linija sm:grid-cols-3">
          {accountLinks.slice(1).map((link) => (
            <li key={link.href} className="bg-papir">
              <Link href={link.href} className="block p-5 font-display text-h3 transition-colors hover:bg-papir-2 hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
