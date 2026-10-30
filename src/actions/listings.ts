"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { noticeParam } from "@/lib/auth/routes";
import type { PropertyType } from "@/lib/domain/enums";
import { allowedFeaturesFor, isFieldVisible, maxListingImages } from "@/lib/domain/listing-fields";
import { isPointInMunicipality } from "@/lib/geo/point-in-municipality";
import { listingNotices, listingRoutes } from "@/lib/listings/routes";
import { listingImagesBucket } from "@/lib/listings/load-owned-listing";
import { listingsCacheTag } from "@/lib/search/cache-tags";
import type { ListingErrorCode } from "@/lib/listings/listing-errors";
import type { ListingImage } from "@/lib/listings/types";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  basicsSchema,
  detailsSchemaFor,
  imageOrderSchema,
  imageRegistrationSchema,
  listingIdSchema,
  locationStepSchema,
  publishListingSchema,
  type BasicsFormValues,
  type DetailsFormValues,
  type ImageRegistration,
  type LocationFormValues,
} from "@/lib/validation/listing";

type ListingResult<Data = undefined> = ActionResult<Data, ListingErrorCode>;
type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims ? { supabase, userId: claims.sub } : null;
}

type Session = NonNullable<Awaited<ReturnType<typeof session>>>;

async function ownedListing(current: Session, listingId: string) {
  const { data } = await current.supabase
    .from("listings")
    .select("id, status, type, municipality_id, features")
    .eq("id", listingId)
    .eq("owner_id", current.userId)
    .maybeSingle();
  return data;
}

function databaseErrorCode(message: string | undefined): ListingErrorCode {
  if (!message) {
    return "unexpected";
  }
  if (message.includes("PHONE_REQUIRED")) {
    return "phone_required";
  }
  if (message.includes("LISTING_LIMIT")) {
    return "listing_limit";
  }
  if (message.includes("PUBLISH_REQUIREMENTS")) {
    return "publish_requirements";
  }
  if (message.includes("IMAGE_LIMIT")) {
    return "image_limit";
  }
  if (message.includes("RENEW_NOT_ALLOWED")) {
    return "renew_not_allowed";
  }
  if (message.includes("NOT_FOUND")) {
    return "not_found";
  }
  return "unexpected";
}

function revalidateListing(listingId: string) {
  revalidatePath(listingRoutes.edit(listingId));
  revalidatePath(listingRoutes.mine);
  updateTag(listingsCacheTag);
}

function clearedFieldsForType(type: PropertyType, features: string[]): ListingUpdate {
  const allowed = allowedFeaturesFor(type) as readonly string[];
  return {
    area_m2: isFieldVisible(type, "areaM2") ? undefined : null,
    land_area_m2: isFieldVisible(type, "landAreaM2") ? undefined : null,
    rooms: isFieldVisible(type, "rooms") ? undefined : null,
    bathrooms: isFieldVisible(type, "bathrooms") ? undefined : null,
    floor: isFieldVisible(type, "floor") ? undefined : null,
    total_floors: isFieldVisible(type, "totalFloors") ? undefined : null,
    year_built: isFieldVisible(type, "yearBuilt") ? undefined : null,
    heating: isFieldVisible(type, "heating") ? undefined : null,
    condition: isFieldVisible(type, "condition") ? undefined : null,
    has_usage_permit: isFieldVisible(type, "hasUsagePermit") ? undefined : null,
    features: features.filter((feature) => allowed.includes(feature)) as ListingUpdate["features"],
  };
}

export async function saveBasics(
  listingId: string | null,
  input: BasicsFormValues,
): Promise<ListingResult<{ id: string }>> {
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success || (listingId !== null && !listingIdSchema.safeParse(listingId).success)) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const values = {
    type: parsed.data.type,
    title: parsed.data.title,
    description: parsed.data.description,
    price_km: parsed.data.priceKm,
    price_negotiable: parsed.data.priceNegotiable,
  };

  if (listingId === null) {
    const { data, error } = await current.supabase
      .from("listings")
      .insert({ ...values, owner_id: current.userId, status: "draft" })
      .select("id")
      .single();
    if (error || !data) {
      return failure(databaseErrorCode(error?.message));
    }
    revalidatePath(listingRoutes.mine);
    return success({ id: data.id });
  }

  const existing = await ownedListing(current, listingId);
  if (!existing) {
    return failure("not_found");
  }
  if (existing.status === "hidden") {
    return failure("hidden");
  }
  const typeChanged = existing.type !== values.type;
  const update: ListingUpdate = typeChanged
    ? { ...clearedFieldsForType(values.type, existing.features), ...values }
    : values;
  const { error } = await current.supabase.from("listings").update(update).eq("id", listingId);
  if (error) {
    return failure(databaseErrorCode(error.message));
  }
  revalidateListing(listingId);
  return success({ id: listingId });
}

export async function saveLocation(listingId: string, input: LocationFormValues): Promise<ListingResult> {
  const parsed = locationStepSchema.safeParse(input);
  if (!parsed.success || !listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const existing = await ownedListing(current, listingId);
  if (!existing) {
    return failure("not_found");
  }
  if (existing.status === "hidden") {
    return failure("hidden");
  }

  const municipalityId = Number(parsed.data.municipalityId);
  const { data: municipality } = await current.supabase
    .from("municipalities")
    .select("slug")
    .eq("id", municipalityId)
    .maybeSingle();
  if (!municipality) {
    return failure("validation");
  }
  const { lat, lng } = parsed.data;
  if (lat === null || lng === null || !isPointInMunicipality(municipality.slug, lat, lng)) {
    return failure("point_outside");
  }

  const { error } = await current.supabase
    .from("listings")
    .update({
      municipality_id: municipalityId,
      neighborhood: parsed.data.neighborhood || null,
      address: parsed.data.address || null,
      location_precise: parsed.data.locationPrecise,
      lat,
      lng,
    })
    .eq("id", listingId);
  if (error) {
    return failure(databaseErrorCode(error.message));
  }
  revalidateListing(listingId);
  return success();
}

export async function saveDetails(listingId: string, input: DetailsFormValues): Promise<ListingResult> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const existing = await ownedListing(current, listingId);
  if (!existing) {
    return failure("not_found");
  }
  if (existing.status === "hidden") {
    return failure("hidden");
  }
  const parsed = detailsSchemaFor(existing.type).safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const details = parsed.data;
  const { error } = await current.supabase
    .from("listings")
    .update({
      area_m2: details.areaM2,
      land_area_m2: details.landAreaM2,
      rooms: details.rooms,
      bathrooms: details.bathrooms,
      floor: details.floor,
      total_floors: details.totalFloors,
      year_built: details.yearBuilt,
      heating: details.heating,
      condition: details.condition,
      is_registered: details.isRegistered,
      has_building_permit: details.hasBuildingPermit,
      has_usage_permit: details.hasUsagePermit,
      features: details.features,
    })
    .eq("id", listingId);
  if (error) {
    return failure(databaseErrorCode(error.message));
  }
  revalidateListing(listingId);
  return success();
}

async function listImages(current: Session, listingId: string): Promise<ListingImage[]> {
  const { data } = await current.supabase
    .from("listing_images")
    .select("id, storage_path, position, width, height")
    .eq("listing_id", listingId)
    .order("position");
  return (data ?? []).map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    publicUrl: current.supabase.storage.from(listingImagesBucket).getPublicUrl(row.storage_path).data.publicUrl,
    position: row.position,
    width: row.width,
    height: row.height,
  }));
}

export async function registerImage(listingId: string, input: ImageRegistration): Promise<ListingResult<ListingImage>> {
  const parsed = imageRegistrationSchema.safeParse(input);
  if (!parsed.success || !listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const expectedPrefix = `${current.userId}/${listingId}/`;
  const fileName = parsed.data.storagePath.slice(expectedPrefix.length);
  if (!parsed.data.storagePath.startsWith(expectedPrefix) || !/^[0-9a-f-]{36}\.webp$/.test(fileName)) {
    return failure("validation");
  }
  const existing = await ownedListing(current, listingId);
  if (!existing) {
    return failure("not_found");
  }

  const images = await listImages(current, listingId);
  if (images.length >= maxListingImages) {
    await current.supabase.storage.from(listingImagesBucket).remove([parsed.data.storagePath]);
    return failure("image_limit");
  }
  const nextPosition = images.reduce((highest, image) => Math.max(highest, image.position + 1), 0);
  const { data, error } = await current.supabase
    .from("listing_images")
    .insert({
      listing_id: listingId,
      storage_path: parsed.data.storagePath,
      position: nextPosition,
      width: parsed.data.width,
      height: parsed.data.height,
    })
    .select("id, storage_path, position, width, height")
    .single();
  if (error || !data) {
    await current.supabase.storage.from(listingImagesBucket).remove([parsed.data.storagePath]);
    return failure(databaseErrorCode(error?.message));
  }
  revalidateListing(listingId);
  return success({
    id: data.id,
    storagePath: data.storage_path,
    publicUrl: current.supabase.storage.from(listingImagesBucket).getPublicUrl(data.storage_path).data.publicUrl,
    position: data.position,
    width: data.width,
    height: data.height,
  });
}

export async function reorderImages(listingId: string, orderedImageIds: string[]): Promise<ListingResult> {
  const parsed = imageOrderSchema.safeParse(orderedImageIds);
  if (!parsed.success || !listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const { error } = await current.supabase.rpc("reorder_listing_images", {
    target_listing_id: listingId,
    ordered_image_ids: parsed.data,
  });
  if (error) {
    return failure(error.message.includes("NOT_FOUND") ? "not_found" : "unexpected");
  }
  revalidateListing(listingId);
  return success();
}

export async function deleteImage(listingId: string, imageId: string): Promise<ListingResult<ListingImage[]>> {
  if (!listingIdSchema.safeParse(listingId).success || !listingIdSchema.safeParse(imageId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const { data: removed, error } = await current.supabase
    .from("listing_images")
    .delete()
    .eq("id", imageId)
    .eq("listing_id", listingId)
    .select("storage_path")
    .maybeSingle();
  if (error || !removed) {
    return failure("not_found");
  }
  await current.supabase.storage.from(listingImagesBucket).remove([removed.storage_path]);

  const remaining = await listImages(current, listingId);
  if (remaining.some((image, index) => image.position !== index)) {
    await current.supabase.rpc("reorder_listing_images", {
      target_listing_id: listingId,
      ordered_image_ids: remaining.map((image) => image.id),
    });
  }
  revalidateListing(listingId);
  return success(remaining.map((image, index) => ({ ...image, position: index })));
}

export async function publishListing(listingId: string): Promise<ListingResult> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const { data: listing } = await current.supabase
    .from("listings")
    .select("id, status, type, title, municipality_id, public_lat, public_lng, price_km, price_negotiable, area_m2, land_area_m2, floor")
    .eq("id", listingId)
    .eq("owner_id", current.userId)
    .maybeSingle();
  if (!listing) {
    return failure("not_found");
  }
  if (listing.status === "hidden") {
    return failure("hidden");
  }
  const { count } = await current.supabase
    .from("listing_images")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);

  const ready = publishListingSchema.safeParse({
    type: listing.type,
    title: listing.title,
    municipalityId: listing.municipality_id,
    lat: listing.public_lat,
    lng: listing.public_lng,
    priceKm: listing.price_km,
    priceNegotiable: listing.price_negotiable,
    imageCount: count ?? 0,
    areaM2: listing.area_m2,
    landAreaM2: listing.land_area_m2,
    floor: listing.floor,
  });
  if (!ready.success) {
    return failure("publish_requirements");
  }

  if (listing.status !== "active") {
    const { error } = await current.supabase.from("listings").update({ status: "active" }).eq("id", listingId);
    if (error) {
      return failure(databaseErrorCode(error.message));
    }
  }
  revalidateListing(listingId);
  redirect(`${listingRoutes.mine}?${noticeParam}=${listingNotices.published}`);
}

export async function finishEditing(listingId: string): Promise<void> {
  const current = await session();
  const listing = current && listingIdSchema.safeParse(listingId).success ? await ownedListing(current, listingId) : null;
  revalidateListing(listingId);
  const notice = listing?.status === "draft" ? listingNotices.draftSaved : listingNotices.saved;
  redirect(`${listingRoutes.mine}?${noticeParam}=${notice}`);
}

export async function renewListing(listingId: string): Promise<ListingResult<{ expiresAt: string }>> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const { data, error } = await current.supabase.rpc("renew_listing", { listing_id: listingId });
  if (error || !data) {
    return failure(databaseErrorCode(error?.message));
  }
  revalidateListing(listingId);
  return success({ expiresAt: data });
}

async function listFolder(current: Session, folder: string): Promise<string[]> {
  const { data } = await current.supabase.storage.from(listingImagesBucket).list(folder, { limit: 1000 });
  return (data ?? []).filter((entry) => entry.id !== null).map((entry) => `${folder}/${entry.name}`);
}

export async function deleteListing(listingId: string): Promise<ListingResult> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await session();
  if (!current) {
    return failure("unauthenticated");
  }
  const existing = await ownedListing(current, listingId);
  if (!existing) {
    return failure("not_found");
  }
  const { data: imageRows } = await current.supabase
    .from("listing_images")
    .select("storage_path")
    .eq("listing_id", listingId);
  const folderFiles = await listFolder(current, `${current.userId}/${listingId}`);
  const paths = [...new Set([...(imageRows ?? []).map((row) => row.storage_path), ...folderFiles])];
  if (paths.length > 0) {
    await current.supabase.storage.from(listingImagesBucket).remove(paths);
  }
  const { error } = await current.supabase.from("listings").delete().eq("id", listingId).eq("owner_id", current.userId);
  if (error) {
    return failure("unexpected");
  }
  revalidateListing(listingId);
  return success();
}
