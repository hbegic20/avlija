import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { listingPath } from "@/lib/listings/listing-path";
import type { ListingPin, ListingSummary } from "@/lib/listings/summary";
import { createPublicClient, publicStorageUrl } from "@/lib/supabase/public";
import { toSearchableText } from "@/lib/text/searchable";
import { listingsCacheTag } from "./cache-tags";
import { pageSize, type SearchFilters } from "./filters";

const summaryColumns =
  "id, number, title, type, status, price_km, price_negotiable, area_m2, land_area_m2, rooms, floor, total_floors, neighborhood, is_registered, published_at, public_lat, public_lng, location_precise, municipalities!inner(name, slug), listing_images(storage_path, position)";

const maxMapPins = 500;

export type SummaryRow = {
  id: string;
  number: number;
  title: string;
  type: ListingSummary["type"];
  status: ListingSummary["status"];
  price_km: number | null;
  price_negotiable: boolean;
  area_m2: number | null;
  land_area_m2: number | null;
  rooms: number | null;
  floor: number | null;
  total_floors: number | null;
  neighborhood: string | null;
  is_registered: boolean | null;
  published_at: string | null;
  public_lat: number | null;
  public_lng: number | null;
  location_precise: boolean;
  municipalities: { name: string; slug: string } | null;
  listing_images: { storage_path: string; position: number }[];
};

export function toSummary(row: SummaryRow): ListingSummary {
  const cover = [...row.listing_images].sort((a, b) => a.position - b.position)[0];
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    type: row.type,
    status: row.status,
    priceKm: row.price_km,
    priceNegotiable: row.price_negotiable,
    areaM2: row.area_m2,
    landAreaM2: row.land_area_m2,
    rooms: row.rooms,
    floor: row.floor,
    totalFloors: row.total_floors,
    neighborhood: row.neighborhood,
    isRegistered: row.is_registered,
    publishedAt: row.published_at,
    publicLat: row.public_lat,
    publicLng: row.public_lng,
    locationPrecise: row.location_precise,
    municipalityName: row.municipalities?.name ?? null,
    municipalitySlug: row.municipalities?.slug ?? null,
    coverUrl: cover ? publicStorageUrl("listing-images", cover.storage_path) : null,
    path: listingPath(row.number, row.title),
  };
}

type PublicClient = ReturnType<typeof createPublicClient>;

function filteredListings(client: PublicClient, columns: string, filters: SearchFilters, withCount: boolean) {
  let query = client.from("listings").select(columns, withCount ? { count: "exact" } : undefined);
  query = filters.includeSold ? query.in("status", ["active", "sold"]) : query.eq("status", "active");
  if (filters.municipalities.length > 0) {
    query = query.in("municipalities.slug", filters.municipalities);
  }
  if (filters.types.length > 0) {
    query = query.in("type", filters.types);
  }
  if (filters.priceFrom !== null) {
    query = query.gte("price_km", filters.priceFrom);
  }
  if (filters.priceTo !== null) {
    query = query.lte("price_km", filters.priceTo);
  }
  if (filters.areaFrom !== null) {
    query = query.gte("area_m2", filters.areaFrom);
  }
  if (filters.areaTo !== null) {
    query = query.lte("area_m2", filters.areaTo);
  }
  if (filters.landFrom !== null) {
    query = query.gte("land_area_m2", filters.landFrom);
  }
  if (filters.landTo !== null) {
    query = query.lte("land_area_m2", filters.landTo);
  }
  if (filters.roomsMin !== null) {
    query = query.gte("rooms", filters.roomsMin);
  }
  if (filters.registeredOnly) {
    query = query.eq("is_registered", true);
  }
  if (filters.features.length > 0) {
    query = query.contains("features", filters.features);
  }
  if (filters.query) {
    query = query.textSearch("search", toSearchableText(filters.query), { config: "simple", type: "websearch" });
  }
  return query;
}

const sortColumns = {
  najnovije: { column: "published_at", ascending: false },
  najjeftinije: { column: "price_km", ascending: true },
  najskuplje: { column: "price_km", ascending: false },
  "cijena-m2": { column: "price_per_m2", ascending: true },
  povrsina: { column: "main_area_m2", ascending: false },
} as const;

export type SearchPage = {
  items: ListingSummary[];
  total: number;
};

export async function searchListings(filters: SearchFilters): Promise<SearchPage> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife("minutes");

  const client = createPublicClient();
  const sort = sortColumns[filters.sort];
  const from = (filters.page - 1) * pageSize;
  const { data, count, error } = await filteredListings(client, summaryColumns, filters, true)
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .order("number", { ascending: false })
    .order("position", { referencedTable: "listing_images" })
    .limit(1, { referencedTable: "listing_images" })
    .range(from, from + pageSize - 1);

  if (error) {
    const { count: total } = await filteredListings(client, "id, municipalities!inner(slug)", filters, true).limit(1);
    return { items: [], total: total ?? 0 };
  }
  return { items: (data as unknown as SummaryRow[]).map(toSummary), total: count ?? 0 };
}

export async function searchPins(filters: SearchFilters): Promise<ListingPin[]> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife("minutes");

  const { data } = await filteredListings(
    createPublicClient(),
    "id, number, title, price_km, price_negotiable, public_lat, public_lng, location_precise, municipalities!inner(slug)",
    filters,
    false,
  )
    .not("public_lat", "is", null)
    .order("published_at", { ascending: false })
    .limit(maxMapPins);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    number: number;
    title: string;
    price_km: number | null;
    price_negotiable: boolean;
    public_lat: number;
    public_lng: number;
    location_precise: boolean;
  }>;
  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    title: row.title,
    priceKm: row.price_km,
    priceNegotiable: row.price_negotiable,
    lat: row.public_lat,
    lng: row.public_lng,
    precise: row.location_precise,
    path: listingPath(row.number, row.title),
  }));
}

export async function latestListings(limit = 8): Promise<ListingSummary[]> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife("minutes");

  const { data } = await createPublicClient()
    .from("listings")
    .select(summaryColumns)
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .order("position", { referencedTable: "listing_images" })
    .limit(1, { referencedTable: "listing_images" })
    .limit(limit);
  return ((data ?? []) as unknown as SummaryRow[]).map(toSummary);
}

export type MunicipalityWithCount = {
  id: number;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  activeCount: number;
};

export async function municipalitiesWithCounts(): Promise<MunicipalityWithCount[]> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const client = createPublicClient();
  const [{ data: municipalities }, { data: counts }] = await Promise.all([
    client.from("municipalities").select("id, slug, name, lat, lng").order("name"),
    client.rpc("municipality_listing_counts"),
  ]);
  const countById = new Map((counts ?? []).map((row) => [row.municipality_id, Number(row.active_count)]));
  return (municipalities ?? []).map((municipality) => ({
    ...municipality,
    activeCount: countById.get(municipality.id) ?? 0,
  }));
}

export async function similarListings(
  listingId: string,
  municipalitySlug: string,
  type: ListingSummary["type"],
  priceKm: number | null,
  limit = 4,
): Promise<ListingSummary[]> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife("minutes");

  const { data } = await createPublicClient()
    .from("listings")
    .select(summaryColumns)
    .eq("status", "active")
    .eq("type", type)
    .eq("municipalities.slug", municipalitySlug)
    .neq("id", listingId)
    .order("published_at", { ascending: false })
    .order("position", { referencedTable: "listing_images" })
    .limit(1, { referencedTable: "listing_images" })
    .limit(40);
  const candidates = ((data ?? []) as unknown as SummaryRow[]).map(toSummary);
  if (priceKm === null) {
    return candidates.slice(0, limit);
  }
  const distance = (candidate: ListingSummary) =>
    candidate.priceKm === null ? Number.POSITIVE_INFINITY : Math.abs(candidate.priceKm - priceKm);
  return candidates.sort((a, b) => distance(a) - distance(b)).slice(0, limit);
}

export async function sellerActiveListings(sellerId: string): Promise<ListingSummary[]> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife("minutes");

  const { data } = await createPublicClient()
    .from("listings")
    .select(summaryColumns)
    .eq("status", "active")
    .eq("owner_id", sellerId)
    .order("published_at", { ascending: false })
    .order("position", { referencedTable: "listing_images" })
    .limit(1, { referencedTable: "listing_images" })
    .limit(48);
  return ((data ?? []) as unknown as SummaryRow[]).map(toSummary);
}
