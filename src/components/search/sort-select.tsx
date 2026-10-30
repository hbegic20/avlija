"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { bs } from "@/lib/i18n/bs";
import { searchHref, sortOptions, withChanges, type SearchFilters, type SortOption } from "@/lib/search/filters";

export function SortSelect({ filters, fixedMunicipality }: { filters: SearchFilters; fixedMunicipality?: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Select
      label={bs.search.sort}
      options={sortOptions.map((option) => ({ value: option, label: bs.search.sorts[option] }))}
      value={filters.sort}
      fieldClassName="w-full sm:w-56"
      onChange={(event) =>
        startTransition(() =>
          router.push(searchHref(withChanges(filters, { sort: event.target.value as SortOption }), fixedMunicipality), {
            scroll: false,
          }),
        )
      }
    />
  );
}
