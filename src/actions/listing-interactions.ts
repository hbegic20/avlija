"use server";

import { revalidatePath, updateTag } from "next/cache";
import { failure, success, type ActionResult } from "@/lib/action-result";
import type { InteractionErrorCode } from "@/lib/listings/interaction-errors";
import { listingCacheTag } from "@/lib/listings/public-listing";
import { listingRoutes } from "@/lib/listings/routes";
import { listingsCacheTag } from "@/lib/search/cache-tags";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { listingIdSchema } from "@/lib/validation/listing";
import { reportSchema, type ReportInput } from "@/lib/validation/report";

type InteractionResult<Data = undefined> = ActionResult<Data, InteractionErrorCode>;

export type SellerContact = {
  phone: string | null;
  hasViber: boolean;
  hasWhatsapp: boolean;
};

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims ? { supabase, userId: claims.sub } : null;
}

export async function recordView(listingId: string): Promise<void> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return;
  }
  await createPublicClient().rpc("increment_listing_view", { listing_id: listingId });
}

export async function revealContact(listingId: string): Promise<InteractionResult<SellerContact>> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const { data, error } = await current.supabase.rpc("get_seller_contact", { listing_id: listingId });
  if (error) {
    return failure("unexpected");
  }
  const contact = data?.[0];
  if (!contact) {
    return failure("not_found");
  }
  return success({ phone: contact.phone, hasViber: contact.has_viber, hasWhatsapp: contact.has_whatsapp });
}

export async function setFavorite(listingId: string, favorite: boolean): Promise<InteractionResult<{ favorite: boolean }>> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const { error } = favorite
    ? await current.supabase
        .from("favorites")
        .upsert({ user_id: current.userId, listing_id: listingId }, { onConflict: "user_id,listing_id", ignoreDuplicates: true })
    : await current.supabase.from("favorites").delete().eq("user_id", current.userId).eq("listing_id", listingId);
  if (error) {
    return failure(error.code === "23503" ? "not_found" : "unexpected");
  }
  revalidatePath("/moj-racun/sacuvano");
  return success({ favorite });
}

export async function reportListing(listingId: string, input: ReportInput): Promise<InteractionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success || !listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const { error } = await current.supabase.from("reports").insert({
    listing_id: listingId,
    reporter_id: current.userId,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });
  if (error) {
    return failure(error.code === "23505" ? "duplicate" : error.code === "23503" ? "not_found" : "unexpected");
  }
  return success();
}

export async function changeOwnListingStatus(
  listingId: string,
  status: "sold" | "archived",
): Promise<InteractionResult> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const { data, error } = await current.supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId)
    .eq("owner_id", current.userId)
    .eq("status", "active")
    .select("number")
    .maybeSingle();
  if (error || !data) {
    return failure(error ? "unexpected" : "not_found");
  }
  updateTag(listingsCacheTag);
  updateTag(listingCacheTag(data.number));
  revalidatePath(listingRoutes.mine);
  return success();
}
