import { listingFeatures, propertyTypes, type ListingFeature, type PropertyType } from "@/lib/domain/enums";
import { sbkMunicipalities } from "@/lib/domain/municipalities";

export const searchParamNames = {
  municipality: "opcina",
  type: "vrsta",
  priceFrom: "cijena_od",
  priceTo: "cijena_do",
  areaFrom: "povrsina_od",
  areaTo: "povrsina_do",
  landFrom: "plac_od",
  landTo: "plac_do",
  roomsMin: "sobe",
  registered: "uknjizeno",
  feature: "oprema",
  query: "q",
  sort: "sort",
  page: "stranica",
  view: "prikaz",
  includeSold: "prodani",
} as const;

export const sortOptions = ["najnovije", "najjeftinije", "najskuplje", "cijena-m2", "povrsina"] as const;
export type SortOption = (typeof sortOptions)[number];

export const viewOptions = ["mreza", "karta"] as const;
export type ViewOption = (typeof viewOptions)[number];

export const pageSize = 24;
export const maxQueryLength = 100;

export type SearchFilters = {
  municipalities: string[];
  types: PropertyType[];
  priceFrom: number | null;
  priceTo: number | null;
  areaFrom: number | null;
  areaTo: number | null;
  landFrom: number | null;
  landTo: number | null;
  roomsMin: number | null;
  registeredOnly: boolean;
  features: ListingFeature[];
  query: string;
  sort: SortOption;
  page: number;
  view: ViewOption;
  includeSold: boolean;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

const municipalitySlugs = new Set(sbkMunicipalities.map((municipality) => municipality.slug));

function all(params: RawSearchParams, name: string): string[] {
  const value = params[name];
  if (value === undefined) {
    return [];
  }
  return (Array.isArray(value) ? value : [value]).flatMap((entry) => entry.split(",")).filter(Boolean);
}

function first(params: RawSearchParams, name: string): string {
  return all(params, name)[0] ?? "";
}

function positiveNumber(params: RawSearchParams, name: string, max: number): number | null {
  const raw = first(params, name).replace(/\./g, "").replace(",", ".");
  if (raw === "") {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= max ? value : null;
}

function oneOf<Option extends string>(options: readonly Option[], value: string, fallback: Option): Option {
  return (options as readonly string[]).includes(value) ? (value as Option) : fallback;
}

function unique<Value>(values: Value[]): Value[] {
  return [...new Set(values)];
}

export function parseSearchFilters(params: RawSearchParams, fixedMunicipality?: string): SearchFilters {
  const names = searchParamNames;
  const page = Math.floor(Number(first(params, names.page)) || 1);
  return {
    municipalities: fixedMunicipality
      ? [fixedMunicipality]
      : unique(all(params, names.municipality).filter((slug) => municipalitySlugs.has(slug))),
    types: unique(
      all(params, names.type).filter((type): type is PropertyType => (propertyTypes as readonly string[]).includes(type)),
    ),
    priceFrom: positiveNumber(params, names.priceFrom, 2_000_000_000),
    priceTo: positiveNumber(params, names.priceTo, 2_000_000_000),
    areaFrom: positiveNumber(params, names.areaFrom, 99_999_999),
    areaTo: positiveNumber(params, names.areaTo, 99_999_999),
    landFrom: positiveNumber(params, names.landFrom, 99_999_999),
    landTo: positiveNumber(params, names.landTo, 99_999_999),
    roomsMin: positiveNumber(params, names.roomsMin, 99),
    registeredOnly: first(params, names.registered) === "1",
    features: unique(
      all(params, names.feature).filter((feature): feature is ListingFeature =>
        (listingFeatures as readonly string[]).includes(feature),
      ),
    ),
    query: first(params, names.query).trim().slice(0, maxQueryLength),
    sort: oneOf(sortOptions, first(params, names.sort), "najnovije"),
    page: Math.min(Math.max(page, 1), 500),
    view: oneOf(viewOptions, first(params, names.view), "mreza"),
    includeSold: first(params, names.includeSold) === "1",
  };
}

export const emptyFilters: SearchFilters = parseSearchFilters({});

export function toSearchParams(filters: SearchFilters, fixedMunicipality?: string): URLSearchParams {
  const names = searchParamNames;
  const params = new URLSearchParams();
  if (!fixedMunicipality) {
    for (const slug of filters.municipalities) {
      params.append(names.municipality, slug);
    }
  }
  for (const type of filters.types) {
    params.append(names.type, type);
  }
  const numbers: Array<[string, number | null]> = [
    [names.priceFrom, filters.priceFrom],
    [names.priceTo, filters.priceTo],
    [names.areaFrom, filters.areaFrom],
    [names.areaTo, filters.areaTo],
    [names.landFrom, filters.landFrom],
    [names.landTo, filters.landTo],
    [names.roomsMin, filters.roomsMin],
  ];
  for (const [name, value] of numbers) {
    if (value !== null) {
      params.set(name, String(value));
    }
  }
  if (filters.registeredOnly) {
    params.set(names.registered, "1");
  }
  for (const feature of filters.features) {
    params.append(names.feature, feature);
  }
  if (filters.query) {
    params.set(names.query, filters.query);
  }
  if (filters.includeSold) {
    params.set(names.includeSold, "1");
  }
  if (filters.sort !== "najnovije") {
    params.set(names.sort, filters.sort);
  }
  if (filters.view !== "mreza") {
    params.set(names.view, filters.view);
  }
  if (filters.page > 1) {
    params.set(names.page, String(filters.page));
  }
  return params;
}

export const listingsBasePath = "/nekretnine";

export function searchBasePath(fixedMunicipality?: string): string {
  return fixedMunicipality ? `${listingsBasePath}/${fixedMunicipality}` : listingsBasePath;
}

export function searchHref(filters: SearchFilters, fixedMunicipality?: string): string {
  const query = toSearchParams(filters, fixedMunicipality).toString();
  const base = searchBasePath(fixedMunicipality);
  return query ? `${base}?${query}` : base;
}

export function withChanges(filters: SearchFilters, changes: Partial<SearchFilters>): SearchFilters {
  return { ...filters, page: 1, ...changes };
}

export function cacheKeyOf(filters: SearchFilters): string {
  return toSearchParams({ ...filters, view: "mreza" }).toString();
}
