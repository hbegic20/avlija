import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { ListingsBrowser } from "@/components/search/listings-browser";
import { ResultsSkeleton } from "@/components/search/results-skeleton";
import { SearchPageHeader } from "@/components/search/search-page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { sbkMunicipalities } from "@/lib/domain/municipalities";
import { bs } from "@/lib/i18n/bs";
import { parseSearchFilters } from "@/lib/search/filters";

type MunicipalityPageProps = PageProps<"/nekretnine/[opcina]">;

function findMunicipality(slug: string) {
  return sbkMunicipalities.find((municipality) => municipality.slug === slug);
}

export function generateStaticParams() {
  return sbkMunicipalities.map((municipality) => ({ opcina: municipality.slug }));
}

export async function generateMetadata({ params }: MunicipalityPageProps): Promise<Metadata> {
  const municipality = findMunicipality((await params).opcina);
  if (!municipality) {
    return {};
  }
  return {
    title: bs.search.titleIn(municipality.name),
    description: bs.search.introIn(municipality.name),
    alternates: { canonical: `/nekretnine/${municipality.slug}` },
  };
}

async function MunicipalityListings({ params, searchParams }: MunicipalityPageProps) {
  const [{ opcina }, query] = await Promise.all([params, searchParams]);
  const municipality = findMunicipality(opcina);
  if (!municipality) {
    notFound();
  }
  return (
    <>
      <SearchPageHeader title={bs.search.titleIn(municipality.name)} intro={bs.search.introIn(municipality.name)} />
      <ListingsBrowser filters={parseSearchFilters(query, municipality.slug)} fixedMunicipality={municipality.slug} />
    </>
  );
}

function MunicipalityListingsSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3 border-t-2 border-t-tinta pt-3" aria-hidden="true">
        <Skeleton className="h-11 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <ResultsSkeleton />
    </>
  );
}

export default function MunicipalityListingsPage(props: MunicipalityPageProps) {
  return (
    <Container className="flex flex-col gap-8 py-10">
      <Suspense fallback={<MunicipalityListingsSkeleton />}>
        <MunicipalityListings {...props} />
      </Suspense>
    </Container>
  );
}
