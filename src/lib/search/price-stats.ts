import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { PricePoint } from "@/lib/listings/price-comparison";
import { createPublicClient } from "@/lib/supabase/public";
import { listingsCacheTag } from "./cache-tags";

const maxPricePoints = 2000;

export async function municipalityPricePoints(municipalitySlug: string): Promise<PricePoint[]> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife("minutes");

  const { data } = await createPublicClient()
    .from("listings")
    .select("id, type, price_per_m2, municipalities!inner(slug)")
    .eq("status", "active")
    .eq("municipalities.slug", municipalitySlug)
    .not("price_per_m2", "is", null)
    .limit(maxPricePoints);
  return (data ?? []).flatMap((row) =>
    row.price_per_m2 === null ? [] : [{ id: row.id, type: row.type, pricePerM2: Number(row.price_per_m2) }],
  );
}
