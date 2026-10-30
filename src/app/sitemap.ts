import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { sbkMunicipalities } from "@/lib/domain/municipalities";
import { listingPath } from "@/lib/listings/listing-path";
import { listingsCacheTag } from "@/lib/search/cache-tags";
import { listingsBasePath } from "@/lib/search/filters";
import { absoluteUrl } from "@/lib/seo/site-url";
import { createPublicClient } from "@/lib/supabase/public";

async function activeListingEntries(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag(listingsCacheTag);
  cacheLife("hours");

  const { data } = await createPublicClient()
    .from("listings")
    .select("number, title, updated_at")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(45000);
  return (data ?? []).map((listing) => ({
    url: absoluteUrl(listingPath(listing.number, listing.title)),
    lastModified: listing.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl(listingsBasePath), changeFrequency: "hourly", priority: 0.9 },
    ...["/uslovi-koristenja", "/privatnost", "/kontakt"].map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...sbkMunicipalities.map((municipality) => ({
      url: absoluteUrl(`${listingsBasePath}/${municipality.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
  return [...staticEntries, ...(await activeListingEntries())];
}
