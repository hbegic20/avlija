"use server";

import { failure, success, type ActionResult } from "@/lib/action-result";
import { generateListingText, hasEnoughListingMaterial, type SavedListingFacts } from "@/lib/ai/listing-text";
import { getActionSession, type ActionSession } from "@/lib/auth/action-session";
import { listingFeatures, type ListingFeature } from "@/lib/domain/enums";
import type { ListingTextErrorCode } from "@/lib/listings/listing-text-errors";
import { logServerError } from "@/lib/logging/log-server-error";
import {
  listingNotesMin,
  listingTextRequestSchema,
  type ListingTextRequest,
  type ListingTextSuggestion,
} from "@/lib/validation/listing-text";

type ListingTextResult = ActionResult<ListingTextSuggestion, ListingTextErrorCode>;

function isListingFeature(value: string): value is ListingFeature {
  return (listingFeatures as readonly string[]).includes(value);
}

async function loadSavedFacts(session: ActionSession, listingId: string): Promise<SavedListingFacts | null> {
  const { data } = await session.supabase
    .from("listings")
    .select(
      "neighborhood, area_m2, land_area_m2, rooms, bathrooms, floor, total_floors, year_built, heating, condition, is_registered, has_building_permit, has_usage_permit, features, municipalities(name)",
    )
    .eq("id", listingId)
    .eq("owner_id", session.userId)
    .maybeSingle();
  if (!data) {
    return null;
  }
  return {
    municipality: data.municipalities?.name ?? null,
    neighborhood: data.neighborhood,
    areaM2: data.area_m2,
    landAreaM2: data.land_area_m2,
    rooms: data.rooms,
    bathrooms: data.bathrooms,
    floor: data.floor,
    totalFloors: data.total_floors,
    yearBuilt: data.year_built,
    heating: data.heating,
    condition: data.condition,
    isRegistered: data.is_registered,
    hasBuildingPermit: data.has_building_permit,
    hasUsagePermit: data.has_usage_permit,
    features: (data.features ?? []).filter(isListingFeature),
  };
}

type SuggestionClaim = { ok: true; token: string } | { ok: false; error: ListingTextErrorCode };

async function claimDailySuggestion(session: ActionSession): Promise<SuggestionClaim> {
  const { data, error } = await session.supabase.rpc("claim_ai_suggestion");
  if (!error) {
    return { ok: true, token: data };
  }
  if (error.message.includes("RATE_LIMIT")) {
    return { ok: false, error: "rate_limited" };
  }
  logServerError("ai.claimDailySuggestion", error);
  return { ok: false, error: "unavailable" };
}

async function releaseDailySuggestion(session: ActionSession, token: string): Promise<void> {
  const { error } = await session.supabase.rpc("release_ai_suggestion", { token });
  if (error) {
    logServerError("ai.releaseDailySuggestion", error);
  }
}

export async function suggestListingText(input: ListingTextRequest): Promise<ListingTextResult> {
  const parsed = listingTextRequestSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const session = await getActionSession();
  if (!session) {
    return failure("unauthenticated");
  }

  const { listingId, type, title, notes } = parsed.data;
  const saved = listingId ? await loadSavedFacts(session, listingId) : null;
  if (listingId && !saved) {
    return failure("not_found");
  }
  const material = { type, title, notes, saved };
  if (!hasEnoughListingMaterial(material, listingNotesMin)) {
    return failure("not_enough_input");
  }

  const claim = await claimDailySuggestion(session);
  if (!claim.ok) {
    return failure(claim.error);
  }

  const result = await generateListingText(material);
  if (!result.ok) {
    await releaseDailySuggestion(session, claim.token);
    return failure(result.error === "quota" ? "busy" : "unavailable");
  }
  return success(result.data);
}
