import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { ListingRow } from "@/components/listings/listing-row";
import { OwnerListingActions } from "@/components/listings/owner/owner-listing-actions";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import type { StampVariant } from "@/lib/domain/enums";
import { formatDate, formatInteger, formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { maxActiveListings } from "@/lib/listings/expiry";
import {
  loadMyListings,
  parseStatusTab,
  statusTabs,
  tabStatus,
  type OwnerListing,
} from "@/lib/listings/my-listings";
import { listingRoutes } from "@/lib/listings/routes";

export const instant = false;

export const metadata: Metadata = {
  title: bs.myListings.title,
  robots: { index: false, follow: false },
};

const text = bs.myListings;

type Fact = { label: string; value: string; tone?: "default" | "positive" | "negative" };

function factsFor(listing: OwnerListing): Fact[] {
  const views = { label: text.views, value: formatInteger(listing.viewCount) };
  switch (listing.status) {
    case "active": {
      const days = listing.daysLeft;
      return [
        views,
        ...(listing.publishedAt ? [{ label: text.published, value: formatDate(listing.publishedAt) }] : []),
        ...(listing.expiresAt && days !== null
          ? [{ label: text.expires, value: text.expiresIn(days), tone: days < 7 ? ("negative" as const) : undefined }]
          : []),
      ];
    }
    case "sold":
      return [views, ...(listing.soldAt ? [{ label: text.sold, value: formatDate(listing.soldAt) }] : [])];
    case "archived":
      return [views, ...(listing.expiresAt ? [{ label: text.expired, value: formatDate(listing.expiresAt) }] : [])];
    default:
      return [{ label: text.updated, value: formatDate(listing.updatedAt) }];
  }
}

function rowStamp(listing: OwnerListing): StampVariant | null {
  if (listing.expiringSoon) {
    return "istice";
  }
  if (listing.status === "sold") {
    return "prodano";
  }
  if (listing.status !== "active") {
    return null;
  }
  if (listing.isRegistered) {
    return "uknjizeno";
  }
  return listing.isNew ? "novo" : null;
}

export default async function MyListingsPage({ searchParams }: PageProps<"/moj-racun/oglasi">) {
  const user = await requireUser(listingRoutes.mine);
  const [listings, query] = await Promise.all([loadMyListings(user.id), searchParams]);
  const tab = parseStatusTab(query.status);
  const countByTab = Object.fromEntries(
    statusTabs.map((entry) => [entry, listings.filter((listing) => listing.status === tabStatus[entry]).length]),
  ) as Record<(typeof statusTabs)[number], number>;
  const visible = listings.filter((listing) => listing.status === tabStatus[tab]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-t-tinta pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-h1">{text.title}</h1>
          <p className="font-mono text-mono text-tinta-2">{text.activeLimit(countByTab.aktivni, maxActiveListings)}</p>
        </div>
        <Link href={listingRoutes.create} className={buttonStyles()}>
          {text.newListing}
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title={text.emptyTitle}
          description={text.emptyDescription}
          action={
            <Link href={listingRoutes.create} className={buttonStyles({ variant: "secondary" })}>
              {text.newListing}
            </Link>
          }
        />
      ) : (
        <>
          <nav aria-label={text.tabsLabel} className="overflow-x-auto">
            <ul className="flex min-w-max border-b">
              {statusTabs.map((entry) => {
                const active = entry === tab;
                return (
                  <li key={entry}>
                    <Link
                      href={entry === "aktivni" ? listingRoutes.mine : `${listingRoutes.mine}?status=${entry}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "-mb-px flex items-baseline gap-2 border-b-2 px-4 py-3 text-small font-medium transition-colors",
                        active ? "border-b-crijep text-tinta" : "border-b-transparent text-tinta-2 hover:text-tinta",
                      )}
                    >
                      {text.tabs[entry]}
                      <span className="font-mono text-label">{countByTab[entry]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {visible.length === 0 ? (
            <EmptyState title={text.emptyTabTitle} description={text.emptyTabDescription} />
          ) : (
            <ul className="divide-y border">
              {visible.map((listing) => (
                <li key={listing.id}>
                  <ListingRow
                    listing={listing}
                    stamp={rowStamp(listing)}
                    facts={factsFor(listing)}
                    notice={
                      listing.status === "hidden" ? (
                        <FormAlert tone="error">
                          {text.hiddenReason}: {listing.hiddenReason ?? text.hiddenNoReason}
                        </FormAlert>
                      ) : null
                    }
                    actions={
                      <OwnerListingActions
                        listingId={listing.id}
                        listingNumber={formatListingNumber(listing.number)}
                        status={listing.status}
                        publicPath={listing.path}
                        editHref={listingRoutes.edit(listing.id)}
                        renewable={listing.renewable}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
