import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { ListingsBrowser } from "@/components/search/listings-browser";
import { ResultsSkeleton } from "@/components/search/results-skeleton";
import { SearchPageHeader } from "@/components/search/search-page-header";
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

async function Results({ slug, searchParams }: { slug: string; searchParams: MunicipalityPageProps["searchParams"] }) {
  const filters = parseSearchFilters(await searchParams, slug);
  return <ListingsBrowser filters={filters} fixedMunicipality={slug} />;
}

export default async function MunicipalityListingsPage({ params, searchParams }: MunicipalityPageProps) {
  const { opcina } = await params;
  const municipality = findMunicipality(opcina);
  if (!municipality) {
    notFound();
  }

  return (
    <Container className="flex flex-col gap-8 py-10">
      <SearchPageHeader
        title={bs.search.titleIn(municipality.name)}
        intro={bs.search.introIn(municipality.name)}
      />
      <Suspense fallback={<ResultsSkeleton />}>
        <Results slug={municipality.slug} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
