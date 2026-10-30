import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { ListingsBrowser } from "@/components/search/listings-browser";
import { ResultsSkeleton } from "@/components/search/results-skeleton";
import { SearchPageHeader } from "@/components/search/search-page-header";
import { bs } from "@/lib/i18n/bs";
import { parseSearchFilters } from "@/lib/search/filters";

export const metadata: Metadata = {
  title: bs.search.title,
  description: bs.search.intro,
  alternates: { canonical: "/nekretnine" },
};

async function Results({ searchParams }: { searchParams: PageProps<"/nekretnine">["searchParams"] }) {
  const filters = parseSearchFilters(await searchParams);
  return <ListingsBrowser filters={filters} />;
}

export default function ListingsPage({ searchParams }: PageProps<"/nekretnine">) {
  return (
    <Container className="flex flex-col gap-8 py-10">
      <SearchPageHeader title={bs.search.title} intro={bs.search.intro} />
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
