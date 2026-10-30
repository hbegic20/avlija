import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ListingSheet } from "@/components/listings/listing-card";
import { ListingDetailView } from "@/components/listings/listing-detail-view";
import { ContactReveal } from "@/components/listings/detail/contact-reveal";
import { FavoriteButton } from "@/components/listings/detail/favorite-button";
import { OwnerBar } from "@/components/listings/detail/owner-bar";
import { ReportButton } from "@/components/listings/detail/report-button";
import { SellerBox } from "@/components/listings/detail/seller-box";
import { ShareButton } from "@/components/listings/detail/share-button";
import { ViewCounter } from "@/components/listings/detail/view-counter";
import { FormAlert } from "@/components/auth/form-alert";
import { ListingJsonLd } from "@/components/seo/listing-json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loginPathWithNext } from "@/lib/auth/routes";
import { formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { getPublicListing, parseListingSegment, type PublicListingBundle } from "@/lib/listings/public-listing";
import { listingRoutes } from "@/lib/listings/routes";
import { similarListings } from "@/lib/search/queries";
import { descriptionSnippet } from "@/lib/seo/description";
import { listingSeoTitle } from "@/lib/seo/listing-title";


export const instant = false;

type ListingPageProps = PageProps<"/oglas/[oglas]">;

async function loadBundle(segment: string): Promise<PublicListingBundle | null> {
  const listingNumber = parseListingSegment(segment);
  return listingNumber === null ? null : getPublicListing(listingNumber);
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const bundle = await loadBundle((await params).oglas);
  if (!bundle) {
    return {};
  }
  const title = listingSeoTitle({
    type: bundle.listing.type,
    areaM2: bundle.listing.area_m2,
    landAreaM2: bundle.listing.land_area_m2,
    municipalityName: bundle.municipalityName,
    priceKm: bundle.listing.price_km,
    priceNegotiable: bundle.listing.price_negotiable,
  });
  const description = descriptionSnippet(bundle.listing.description) || bundle.listing.title;
  return {
    title,
    description,
    alternates: { canonical: bundle.path },
    openGraph: { title, description, url: bundle.path, type: "website" },
  };
}

async function ViewerContact({ bundle }: { bundle: PublicListingBundle }) {
  const user = await getCurrentUser();
  return (
    <ContactReveal
      listingId={bundle.listing.id}
      listingNumber={formatListingNumber(bundle.listing.number)}
      listingPath={bundle.path}
      isLoggedIn={user !== null}
      loginHref={loginPathWithNext(bundle.path)}
    />
  );
}

async function ViewerActions({ bundle }: { bundle: PublicListingBundle }) {
  const user = await getCurrentUser();
  const loginHref = loginPathWithNext(bundle.path);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <FavoriteButton listingId={bundle.listing.id} />
        <ShareButton path={bundle.path} title={bundle.listing.title} />
      </div>
      {user?.id === bundle.listing.owner_id ? null : (
        <ReportButton listingId={bundle.listing.id} isLoggedIn={user !== null} loginHref={loginHref} />
      )}
    </div>
  );
}

async function ViewerOwnerBar({ bundle }: { bundle: PublicListingBundle }) {
  const user = await getCurrentUser();
  if (!user || user.id !== bundle.listing.owner_id) {
    return null;
  }
  return (
    <OwnerBar
      listingId={bundle.listing.id}
      editHref={listingRoutes.edit(bundle.listing.id)}
      isActive={bundle.listing.status === "active"}
    />
  );
}

async function SimilarListings({ bundle }: { bundle: PublicListingBundle }) {
  if (!bundle.municipalitySlug) {
    return null;
  }
  const similar = await similarListings(
    bundle.listing.id,
    bundle.municipalitySlug,
    bundle.listing.type,
    bundle.listing.price_km,
  );
  if (similar.length === 0) {
    return null;
  }
  return (
    <section>
      <SectionHeading title={bs.detail.similar} />
      <ListingSheet listings={similar} />
    </section>
  );
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { oglas } = await params;
  const bundle = await loadBundle(oglas);
  if (!bundle) {
    notFound();
  }
  if (decodeURIComponent(`/oglas/${oglas}`) !== bundle.path) {
    permanentRedirect(bundle.path);
  }

  const isSold = bundle.listing.status === "sold";
  const view = {
    listing: bundle.listing,
    images: bundle.images,
    municipalityName: bundle.municipalityName,
    isNew: bundle.isNew,
  };

  return (
    <Container className="flex flex-col gap-14 py-8">
      <ListingJsonLd bundle={bundle} />
      <ViewCounter listingId={bundle.listing.id} />
      <Suspense fallback={null}>
        <ViewerOwnerBar bundle={bundle} />
      </Suspense>
      <ListingDetailView
        view={view}
        afterHeader={isSold ? <FormAlert tone="error">{bs.detail.soldNotice}</FormAlert> : null}
        aside={
          <>
            {bundle.seller ? (
              <SellerBox seller={bundle.seller}>
                {isSold ? null : (
                  <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                    <ViewerContact bundle={bundle} />
                  </Suspense>
                )}
              </SellerBox>
            ) : null}
            <Suspense fallback={<Skeleton className="h-10 w-48" />}>
              <ViewerActions bundle={bundle} />
            </Suspense>
          </>
        }
      />
      <SimilarListings bundle={bundle} />
    </Container>
  );
}
