import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";
import { listingPath } from "./listing-path";
import { parseListingSegment } from "./public-listing-segment";
import { isGoneSoldListing } from "./sold-grace";

const lookupTimeoutMs = 1500;
const cacheTtlMs = 5 * 60_000;
const maxCachedListings = 1000;
const listingPathPattern = /^\/oglas\/([^/]+)$/;

type PublicListingRoute = { status: string; soldAt: string | null; path: string } | null;
type CachedRoute = { route: PublicListingRoute; expiresAt: number };

export type ListingRouteCheck =
  | { kind: "pass" }
  | { kind: "gone" }
  | { kind: "missing" }
  | { kind: "redirect"; location: string };

const routeCache = new Map<number, CachedRoute>();

function rememberRoute(listingNumber: number, route: PublicListingRoute, now: number) {
  routeCache.delete(listingNumber);
  if (routeCache.size >= maxCachedListings) {
    const oldest = routeCache.keys().next().value;
    if (oldest !== undefined) {
      routeCache.delete(oldest);
    }
  }
  routeCache.set(listingNumber, { route, expiresAt: now + cacheTtlMs });
}

async function fetchRoute(listingNumber: number): Promise<PublicListingRoute | undefined> {
  try {
    const url = `${supabaseUrl}/rest/v1/listings?select=number,title,status,sold_at&number=eq.${listingNumber}&status=in.(active,sold)&limit=1`;
    const response = await fetch(url, {
      headers: { apikey: supabasePublishableKey },
      signal: AbortSignal.timeout(lookupTimeoutMs),
    });
    if (!response.ok) {
      return undefined;
    }
    const rows = (await response.json()) as Array<{ number: number; title: string; status: string; sold_at: string | null }>;
    const row = rows[0];
    return row ? { status: row.status, soldAt: row.sold_at, path: listingPath(row.number, row.title) } : null;
  } catch {
    return undefined;
  }
}

function decodedPath(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function checkRoute(route: PublicListingRoute, requestedPath: string, now: number): ListingRouteCheck {
  if (!route) {
    return { kind: "missing" };
  }
  if (isGoneSoldListing(route.status, route.soldAt, now)) {
    return { kind: "gone" };
  }
  return route.path === requestedPath ? { kind: "pass" } : { kind: "redirect", location: route.path };
}

function isTrustedFromCache(check: ListingRouteCheck): boolean {
  return check.kind === "pass" || check.kind === "gone";
}

export function isListingPath(pathname: string): boolean {
  return listingPathPattern.test(pathname);
}

export async function checkListingRoute(pathname: string): Promise<ListingRouteCheck> {
  const match = listingPathPattern.exec(pathname);
  const listingNumber = match ? parseListingSegment(match[1]) : null;
  if (listingNumber === null) {
    return { kind: "missing" };
  }
  const requestedPath = decodedPath(pathname);
  const now = Date.now();
  const cached = routeCache.get(listingNumber);
  if (cached && cached.expiresAt > now) {
    const cachedCheck = checkRoute(cached.route, requestedPath, now);
    if (isTrustedFromCache(cachedCheck)) {
      return cachedCheck;
    }
  }
  const route = await fetchRoute(listingNumber);
  if (route === undefined) {
    return { kind: "pass" };
  }
  rememberRoute(listingNumber, route, now);
  return checkRoute(route, requestedPath, now);
}
