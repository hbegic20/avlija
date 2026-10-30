import { bs } from "@/lib/i18n/bs";
import { listingsBasePath } from "@/lib/search/filters";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";
import { parseListingSegment } from "./public-listing-segment";
import { isGoneSoldListing } from "./sold-grace";

const lookupTimeoutMs = 1500;

export async function isGoneListingPath(pathname: string): Promise<boolean> {
  const match = /^\/oglas\/([^/]+)$/.exec(pathname);
  const listingNumber = match ? parseListingSegment(match[1]) : null;
  if (listingNumber === null) {
    return false;
  }
  try {
    const url = `${supabaseUrl}/rest/v1/listings?select=status,sold_at&number=eq.${listingNumber}&limit=1`;
    const response = await fetch(url, {
      headers: { apikey: supabasePublishableKey },
      signal: AbortSignal.timeout(lookupTimeoutMs),
    });
    if (!response.ok) {
      return false;
    }
    const rows = (await response.json()) as Array<{ status: string; sold_at: string | null }>;
    const row = rows[0];
    return row !== undefined && isGoneSoldListing(row.status, row.sold_at, Date.now());
  } catch {
    return false;
  }
}

export function goneResponseBody(): string {
  const text = bs.detail;
  return `<!doctype html><html lang="bs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${text.goneTitle} | ${bs.site.name}</title></head><body style="margin:0;background:#F3EEE3;color:#1F2421;font-family:Georgia,serif"><main style="max-width:640px;margin:0 auto;padding:64px 16px"><p style="border-top:2px solid #1F2421;padding-top:12px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:#5A5F57">410</p><h1 style="font-size:40px;font-weight:500;margin:12px 0">${text.goneTitle}</h1><p style="font-family:system-ui,sans-serif;color:#5A5F57">${text.goneText}</p><p style="font-family:system-ui,sans-serif"><a href="${listingsBasePath}" style="color:#2F4A3A">${text.goneAction}</a></p></main></body></html>`;
}
