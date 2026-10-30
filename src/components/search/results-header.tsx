import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutGrid, Map } from "lucide-react";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import type { FilterTag } from "@/lib/search/filter-tags";
import { searchHref, viewOptions, type SearchFilters } from "@/lib/search/filters";
import { SortSelect } from "./sort-select";

const viewIcons = { mreza: LayoutGrid, karta: Map } as const;

export function ResultsHeader({
  filters,
  total,
  tags,
  clearHref,
  fixedMunicipality,
  filterButton,
}: {
  filters: SearchFilters;
  total: number;
  tags: FilterTag[];
  clearHref: string;
  fixedMunicipality?: string;
  filterButton: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="font-mono text-price text-tinta" aria-live="polite">
          {bs.search.results(total, formatInteger(total))}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          {filterButton}
          <SortSelect filters={filters} fixedMunicipality={fixedMunicipality} />
          <nav aria-label={bs.search.view} className="inline-flex rounded-xs border border-tinta">
            {viewOptions.map((view) => {
              const Icon = viewIcons[view];
              const active = filters.view === view;
              return (
                <Link
                  key={view}
                  href={searchHref({ ...filters, view }, fixedMunicipality)}
                  aria-current={active ? "page" : undefined}
                  scroll={false}
                  className={cn(
                    "flex h-11 items-center gap-2 border-r border-tinta px-3.5 text-small font-medium last:border-r-0",
                    active ? "bg-tinta text-papir" : "text-tinta hover:bg-papir-2",
                  )}
                >
                  <Icon aria-hidden="true" size={18} strokeWidth={1.5} />
                  {bs.search.views[view]}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <Tag key={tag.key} removeHref={tag.href} removeLabel={bs.search.removeFilter(tag.label)}>
              {tag.label}
            </Tag>
          ))}
          <Link
            href={clearHref}
            className="ml-1 text-small font-medium text-vranica underline underline-offset-3 hover:text-crijep"
          >
            {bs.search.clearAll}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
