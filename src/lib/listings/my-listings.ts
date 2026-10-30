import "server-only";
import type { ListingStatus } from "@/lib/domain/enums";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/public";
import { canRenew, daysUntil, isExpiringSoon } from "./expiry";
import { listingPath } from "./listing-path";
import type { ListingSummary } from "./summary";

export type OwnerListing = ListingSummary & {
  viewCount: number;
  expiresAt: string | null;
  soldAt: string | null;
  updatedAt: string;
  hiddenReason: string | null;
  daysLeft: number | null;
  expiringSoon: boolean;
  renewable: boolean;
  isNew: boolean;
};

export const statusTabs = ["aktivni", "nacrti", "prodani", "arhivirani", "skriveni"] as const;
export type StatusTab = (typeof statusTabs)[number];

export const tabStatus: Record<StatusTab, ListingStatus> = {
  aktivni: "active",
  nacrti: "draft",
  prodani: "sold",
  arhivirani: "archived",
  skriveni: "hidden",
};

export function parseStatusTab(value: string | string[] | undefined): StatusTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return (statusTabs as readonly string[]).includes(raw ?? "") ? (raw as StatusTab) : "aktivni";
}

const ownerColumns =
  "id, number, title, type, status, price_km, price_negotiable, area_m2, land_area_m2, rooms, floor, total_floors, neighborhood, is_registered, published_at, expires_at, sold_at, updated_at, view_count, hidden_reason, public_lat, public_lng, location_precise, municipalities(name, slug), listing_images(storage_path, position)";

type OwnerRow = {
  id: string;
  number: number;
  title: string;
  type: OwnerListing["type"];
  status: ListingStatus;
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
  expires_at: string | null;
  sold_at: string | null;
  updated_at: string;
  view_count: number;
  hidden_reason: string | null;
  public_lat: number | null;
  public_lng: number | null;
  location_precise: boolean;
  municipalities: { name: string; slug: string } | null;
  listing_images: { storage_path: string; position: number }[];
};

const newListingMs = 7 * 86_400_000;

export async function loadMyListings(ownerId: string): Promise<OwnerListing[]> {
  const now = Date.now();
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(ownerColumns)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .order("position", { referencedTable: "listing_images" })
    .limit(1, { referencedTable: "listing_images" });

  return ((data ?? []) as unknown as OwnerRow[]).map((row) => {
    const cover = row.listing_images[0];
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
      viewCount: row.view_count,
      expiresAt: row.expires_at,
      soldAt: row.sold_at,
      updatedAt: row.updated_at,
      hiddenReason: row.hidden_reason,
      daysLeft: daysUntil(row.expires_at, now),
      expiringSoon: row.status === "active" && isExpiringSoon(row.expires_at, now),
      renewable: canRenew(row.status, row.expires_at, now),
      isNew: row.published_at !== null && now - new Date(row.published_at).getTime() < newListingMs,
    };
  });
}

export type DashboardSummary = {
  counts: Record<ListingStatus, number>;
  totalViews: number;
  expiringCount: number;
  avatarUrl: string | null;
  municipalityId: number | null;
};

export async function loadDashboardSummary(ownerId: string): Promise<DashboardSummary> {
  const now = Date.now();
  const supabase = await createClient();
  const [{ data: listings }, { data: profile }] = await Promise.all([
    supabase.from("listings").select("status, view_count, expires_at").eq("owner_id", ownerId),
    supabase.from("profiles").select("avatar_url, municipality_id").eq("id", ownerId).maybeSingle(),
  ]);
  const rows = listings ?? [];
  const counts: Record<ListingStatus, number> = { draft: 0, active: 0, sold: 0, archived: 0, hidden: 0 };
  for (const row of rows) {
    counts[row.status] += 1;
  }
  return {
    counts,
    totalViews: rows.reduce((sum, row) => sum + row.view_count, 0),
    expiringCount: rows.filter((row) => row.status === "active" && isExpiringSoon(row.expires_at, now)).length,
    avatarUrl: profile?.avatar_url ?? null,
    municipalityId: profile?.municipality_id ?? null,
  };
}
