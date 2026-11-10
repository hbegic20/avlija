import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";
import { idSchema } from "@/lib/validation/id";

const lookupTimeoutMs = 1500;
const cacheTtlMs = 5 * 60_000;
const maxCachedSellers = 1000;
const sellerPathPattern = /^\/prodavac\/([^/]+)$/;

const publicSellerExpiry = new Map<string, number>();

function rememberPublicSeller(sellerId: string, now: number) {
  publicSellerExpiry.delete(sellerId);
  if (publicSellerExpiry.size >= maxCachedSellers) {
    const oldest = publicSellerExpiry.keys().next().value;
    if (oldest !== undefined) {
      publicSellerExpiry.delete(oldest);
    }
  }
  publicSellerExpiry.set(sellerId, now + cacheTtlMs);
}

async function fetchIsPublicSeller(sellerId: string): Promise<boolean | undefined> {
  try {
    const url = `${supabaseUrl}/rest/v1/profiles?select=id&id=eq.${sellerId}&limit=1`;
    const response = await fetch(url, {
      headers: { apikey: supabasePublishableKey },
      signal: AbortSignal.timeout(lookupTimeoutMs),
    });
    if (!response.ok) {
      return undefined;
    }
    const rows = (await response.json()) as Array<{ id: string }>;
    return rows.length > 0;
  } catch {
    return undefined;
  }
}

export function isSellerPath(pathname: string): boolean {
  return sellerPathPattern.test(pathname);
}

export async function isMissingSellerPath(pathname: string): Promise<boolean> {
  const sellerId = sellerPathPattern.exec(pathname)?.[1];
  const parsed = idSchema.safeParse(sellerId);
  if (!parsed.success) {
    return true;
  }
  const now = Date.now();
  const cachedUntil = publicSellerExpiry.get(parsed.data);
  if (cachedUntil !== undefined && cachedUntil > now) {
    return false;
  }
  const isPublic = await fetchIsPublicSeller(parsed.data);
  if (isPublic) {
    rememberPublicSeller(parsed.data, now);
  }
  return isPublic === false;
}
