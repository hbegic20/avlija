import Link from "next/link";
import { ListingSheet } from "@/components/listings/listing-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { bs } from "@/lib/i18n/bs";
import { activeFilterTags, clearAllHref } from "@/lib/search/filter-tags";
import { pageSize, searchHref, type SearchFilters } from "@/lib/search/filters";
import { searchListings, searchPins } from "@/lib/search/queries";
import { FilterSheet, FilterSidebar } from "./filter-panel";
import { MapResults } from "./map-results";
import { ResultsHeader } from "./results-header";

export async function ListingsBrowser({
  filters,
  fixedMunicipality,
}: {
  filters: SearchFilters;
  fixedMunicipality?: string;
}) {
  const isMap = filters.view === "karta";
  const [page, pins] = await Promise.all([searchListings(filters), isMap ? searchPins(filters) : Promise.resolve([])]);
  const tags = activeFilterTags(filters, fixedMunicipality);
  const removableCount = tags.filter((tag) => tag.key !== "fixed").length;
  const scopedClearHref = clearAllHref(filters, fixedMunicipality);
  const panelProps = { filters, fixedMunicipality, activeCount: removableCount, clearHref: scopedClearHref };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <FilterSidebar {...panelProps} />
      <div className="flex min-w-0 flex-col gap-6">
        <ResultsHeader
          filters={filters}
          total={page.total}
          tags={tags}
          clearHref={scopedClearHref}
          fixedMunicipality={fixedMunicipality}
          filterButton={<FilterSheet {...panelProps} />}
        />
        {page.items.length === 0 ? (
          <EmptyState
            title={bs.search.emptyTitle}
            description={bs.search.emptyDescription}
            action={
              removableCount > 0 ? (
                <Link href={scopedClearHref} className={buttonStyles({ variant: "secondary" })}>
                  {bs.search.clearAll}
                </Link>
              ) : undefined
            }
          />
        ) : isMap ? (
          <MapResults listings={page.items} pins={pins} />
        ) : (
          <ListingSheet listings={page.items} priorityCount={4} />
        )}
        {page.total > pageSize ? (
          <Pagination
            page={filters.page}
            pageSize={pageSize}
            totalItems={page.total}
            hrefForPage={(target) => searchHref({ ...filters, page: target }, fixedMunicipality)}
          />
        ) : null}
      </div>
    </div>
  );
}

