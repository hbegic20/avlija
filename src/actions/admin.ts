"use server";

import { revalidatePath, updateTag } from "next/cache";
import { failure, success, type ActionResult } from "@/lib/action-result";
import type { AdminErrorCode } from "@/lib/admin/admin-errors";
import { adminRoutes } from "@/lib/admin/routes";
import { getAdminSession } from "@/lib/auth/action-session";
import type { UserRole } from "@/lib/domain/enums";
import { listingCacheTag } from "@/lib/listings/public-listing";
import { logIfUnexpected, logServerError } from "@/lib/logging/log-server-error";
import { listingsCacheTag } from "@/lib/search/cache-tags";
import {
  deleteUserSchema,
  hideListingSchema,
  reportResolutionSchema,
  userRoleSchema,
  type DeleteUserInput,
  type HideListingInput,
  type ReportResolution,
} from "@/lib/validation/admin";
import { deleteUserCompletely } from "@/lib/users/delete-user";
import { idSchema } from "@/lib/validation/id";

type AdminResult<Data = undefined> = ActionResult<Data, AdminErrorCode>;

function revalidateAdmin(listingNumbers: number[] = []) {
  updateTag(listingsCacheTag);
  for (const listingNumber of listingNumbers) {
    updateTag(listingCacheTag(listingNumber));
  }
  revalidatePath(adminRoutes.overview, "layout");
}

export async function hideListing(listingId: string, input: HideListingInput): Promise<AdminResult> {
  const parsed = hideListingSchema.safeParse(input);
  if (!parsed.success || !idSchema.safeParse(listingId).success) {
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
    return failure(logIfUnexpected("admin.hideListing", error, error ? "unexpected" : "not_found"));
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
  if (!idSchema.safeParse(listingId).success) {
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
    return failure(logIfUnexpected("admin.unhideListing", error, /PUBLISH_REQUIREMENTS|PHONE_REQUIRED|LISTING_LIMIT/.test(error.message) ? "unhide_requirements" : "unexpected"));
  }
  revalidateAdmin([listing.number]);
  return success();
}

export async function resolveReport(reportId: string, resolution: ReportResolution): Promise<AdminResult> {
  const parsedResolution = reportResolutionSchema.safeParse(resolution);
  if (!parsedResolution.success || !idSchema.safeParse(reportId).success) {
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
    return failure(logIfUnexpected("admin.resolveReport", error, error ? "unexpected" : "not_found"));
  }
  revalidatePath(adminRoutes.overview, "layout");
  return success();
}

export async function hideAllUserListings(userId: string, input: HideListingInput): Promise<AdminResult<{ count: number }>> {
  const parsed = hideListingSchema.safeParse(input);
  if (!parsed.success || !idSchema.safeParse(userId).success) {
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
    logServerError("admin.hideAllUserListings", error);
    return failure("unexpected");
  }
  const numbers = (data ?? []).map((row) => row.number);
  revalidateAdmin(numbers);
  return success({ count: numbers.length });
}

const roleErrorMarkers: ReadonlyArray<readonly [marker: string, code: AdminErrorCode]> = [
  ["FORBIDDEN", "forbidden"],
  ["NOT_FOUND", "not_found"],
  ["SELF_DEMOTION", "self_demotion"],
  ["LISTED_ADMIN", "listed_admin"],
];

export async function setUserRole(userId: string, role: UserRole): Promise<AdminResult<{ role: UserRole }>> {
  const parsedRole = userRoleSchema.safeParse(role);
  if (!parsedRole.success || !idSchema.safeParse(userId).success) {
    return failure("validation");
  }
  const admin = await getAdminSession();
  if (!admin) {
    return failure("forbidden");
  }
  const { data, error } = await admin.supabase.rpc("set_user_role", {
    target_user_id: userId,
    new_role: parsedRole.data,
  });
  if (error || !data) {
    const code = roleErrorMarkers.find(([marker]) => error?.message.includes(marker))?.[1] ?? "unexpected";
    return failure(logIfUnexpected("admin.setUserRole", error ?? "no role returned", code));
  }
  revalidatePath(adminRoutes.users);
  return success({ role: data });
}

export async function deleteUserAccount(userId: string, input: DeleteUserInput): Promise<AdminResult> {
  if (!deleteUserSchema.safeParse(input).success || !idSchema.safeParse(userId).success) {
    return failure("validation");
  }
  const admin = await getAdminSession();
  if (!admin) {
    return failure("forbidden");
  }
  if (userId === admin.userId) {
    return failure("self_deletion");
  }
  const [{ data: target }, { data: listings }] = await Promise.all([
    admin.supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    admin.supabase.from("listings").select("number").eq("owner_id", userId),
  ]);
  if (!target) {
    return failure("not_found");
  }
  if (target.role === "admin") {
    return failure("target_is_admin");
  }
  try {
    await deleteUserCompletely(userId);
  } catch (error) {
    logServerError("admin.deleteUserAccount", error);
    return failure("unexpected");
  }
  revalidateAdmin((listings ?? []).map((row) => row.number));
  return success();
}
