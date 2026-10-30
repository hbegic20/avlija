import { sbkMunicipalities } from "@/lib/domain/municipalities";
import { formatDecimal, formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { searchHref, withChanges, type SearchFilters } from "./filters";

export type FilterTag = { key: string; label: string; href: string };

export function activeFilterTags(filters: SearchFilters, fixedMunicipality?: string): FilterTag[] {
  const href = (changes: Partial<SearchFilters>) => searchHref(withChanges(filters, changes), fixedMunicipality);
  const tags: FilterTag[] = [];
  const text = bs.search;

  if (fixedMunicipality) {
    const name = sbkMunicipalities.find((municipality) => municipality.slug === fixedMunicipality)?.name ?? fixedMunicipality;
    tags.push({ key: "fixed", label: name, href: searchHref(withChanges(filters, { municipalities: [] })) });
  } else {
    for (const slug of filters.municipalities) {
      const name = sbkMunicipalities.find((municipality) => municipality.slug === slug)?.name ?? slug;
      tags.push({
        key: `m-${slug}`,
        label: name,
        href: href({ municipalities: filters.municipalities.filter((entry) => entry !== slug) }),
      });
    }
  }
  for (const type of filters.types) {
    tags.push({
      key: `t-${type}`,
      label: bs.enums.propertyType[type],
      href: href({ types: filters.types.filter((entry) => entry !== type) }),
    });
  }
  const numeric: Array<[keyof SearchFilters, number | null, (value: string) => string, (value: number) => string]> = [
    ["priceFrom", filters.priceFrom, text.tagPriceFrom, formatInteger],
    ["priceTo", filters.priceTo, text.tagPriceTo, formatInteger],
    ["areaFrom", filters.areaFrom, text.tagAreaFrom, formatDecimal],
    ["areaTo", filters.areaTo, text.tagAreaTo, formatDecimal],
    ["landFrom", filters.landFrom, text.tagLandFrom, formatDecimal],
    ["landTo", filters.landTo, text.tagLandTo, formatDecimal],
    ["roomsMin", filters.roomsMin, text.tagRooms, formatDecimal],
  ];
  for (const [key, value, label, format] of numeric) {
    if (value !== null) {
      tags.push({ key, label: label(format(value)), href: href({ [key]: null }) });
    }
  }
  if (filters.registeredOnly) {
    tags.push({ key: "registered", label: text.registeredOnly, href: href({ registeredOnly: false }) });
  }
  if (filters.includeSold) {
    tags.push({ key: "sold", label: text.includeSold, href: href({ includeSold: false }) });
  }
  for (const feature of filters.features) {
    tags.push({
      key: `f-${feature}`,
      label: bs.enums.feature[feature],
      href: href({ features: filters.features.filter((entry) => entry !== feature) }),
    });
  }
  if (filters.query) {
    tags.push({ key: "q", label: text.tagQuery(filters.query), href: href({ query: "" }) });
  }
  return tags;
}

export function clearAllHref(filters: SearchFilters, fixedMunicipality?: string): string {
  return searchHref(
    withChanges(filters, {
      municipalities: [],
      types: [],
      priceFrom: null,
      priceTo: null,
      areaFrom: null,
      areaTo: null,
      landFrom: null,
      landTo: null,
      roomsMin: null,
      registeredOnly: false,
      includeSold: false,
      features: [],
      query: "",
    }),
    fixedMunicipality,
  );
}
