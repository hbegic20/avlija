"use server";

import { revalidatePath, updateTag } from "next/cache";
import { failure, success, type ActionResult } from "@/lib/action-result";
import type { AdminErrorCode } from "@/lib/admin/admin-errors";
import { getAdminSession } from "@/lib/auth/action-session";
import { listingCacheTag } from "@/lib/listings/public-listing";
import { listingsCacheTag } from "@/lib/search/cache-tags";
import { hideListingSchema, reportResolutionSchema, type HideListingInput, type ReportResolution } from "@/lib/validation/admin";
import { listingIdSchema } from "@/lib/validation/listing";

type AdminResult<Data = undefined> = ActionResult<Data, AdminErrorCode>;

function revalidateAdmin(listingNumbers: number[] = []) {
  updateTag(listingsCacheTag);
  for (const listingNumber of listingNumbers) {
    updateTag(listingCacheTag(listingNumber));
  }
  revalidatePath("/admin", "layout");
}

export async function hideListing(listingId: string, input: HideListingInput): Promise<AdminResult> {
  const parsed = hideListingSchema.safeParse(input);
  if (!parsed.success || !listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const admin = await getAdminSession();
  if (!admin) {
    return failure("forbidden");
  }
  const { data, error } = await admin.supabase
    .from("listings")
    .update({ status: "hidden", hidden_reason: parsed.data.reason })
    .eq("id", listingId)
    .select("number")
    .maybeSingle();
  if (error || !data) {
    return failure(error ? "unexpected" : "not_found");
  }
  await admin.supabase
    .from("reports")
    .update({ status: "resolved", resolved_by: admin.userId })
    .eq("listing_id", listingId)
    .eq("status", "open");
  revalidateAdmin([data.number]);
  return success();
}

export async function unhideListing(listingId: string): Promise<AdminResult> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const admin = await getAdminSession();
  if (!admin) {
    return failure("forbidden");
  }
  const { data: listing } = await admin.supabase
    .from("listings")
    .select("number, status, expires_at")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.status !== "hidden") {
    return failure("not_found");
  }
  const stillValid = listing.expires_at !== null && new Date(listing.expires_at).getTime() > Date.now();
  const { error } = await admin.supabase
    .from("listings")
    .update({ status: stillValid ? "active" : "archived", hidden_reason: null })
    .eq("id", listingId);
  if (error) {
    return failure(/PUBLISH_REQUIREMENTS|PHONE_REQUIRED|LISTING_LIMIT/.test(error.message) ? "unhide_requirements" : "unexpected");
  }
  revalidateAdmin([listing.number]);
  return success();
}

export async function resolveReport(reportId: string, resolution: ReportResolution): Promise<AdminResult> {
  const parsedResolution = reportResolutionSchema.safeParse(resolution);
  if (!parsedResolution.success || !listingIdSchema.safeParse(reportId).success) {
    return failure("validation");
  }
  const admin = await getAdminSession();
  if (!admin) {
    return failure("forbidden");
  }
  const { data, error } = await admin.supabase
    .from("reports")
    .update({ status: parsedResolution.data, resolved_by: admin.userId })
    .eq("id", reportId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return failure(error ? "unexpected" : "not_found");
  }
  revalidatePath("/admin", "layout");
  return success();
}

export async function hideAllUserListings(userId: string, input: HideListingInput): Promise<AdminResult<{ count: number }>> {
  const parsed = hideListingSchema.safeParse(input);
  if (!parsed.success || !listingIdSchema.safeParse(userId).success) {
    return failure("validation");
  }
  const admin = await getAdminSession();
  if (!admin) {
    return failure("forbidden");
  }
  const { data, error } = await admin.supabase
    .from("listings")
    .update({ status: "hidden", hidden_reason: parsed.data.reason })
    .eq("owner_id", userId)
    .in("status", ["active", "sold"])
    .select("number");
  if (error) {
    return failure("unexpected");
  }
  const numbers = (data ?? []).map((row) => row.number);
  revalidateAdmin(numbers);
  return success({ count: numbers.length });
}
