"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { getActionSession, type ActionSession } from "@/lib/auth/action-session";
import { noticeParam } from "@/lib/auth/routes";
import type { PropertyType } from "@/lib/domain/enums";
import { allowedFeaturesFor, isFieldVisible, maxListingImages } from "@/lib/domain/listing-fields";
import { isPointInMunicipality } from "@/lib/geo/point-in-municipality";
import { listingNotices, listingRoutes } from "@/lib/listings/routes";
import { listingsCacheTag } from "@/lib/search/cache-tags";
import type { ListingErrorCode } from "@/lib/listings/listing-errors";
import { listingImageColumns, toListingImage } from "@/lib/listings/listing-image";
import type { ListingImage } from "@/lib/listings/types";
import { listingImagesBucket } from "@/lib/supabase/storage-url";
import type { Database } from "@/lib/supabase/database.types";
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

async function ownedListing(current: ActionSession, listingId: string) {
  const { data } = await current.supabase
    .from("listings")
    .select("id, status, type, municipality_id, features")
    .eq("id", listingId)
    .eq("owner_id", current.userId)
    .maybeSingle();
  return data;
}

type OwnedListing = NonNullable<Awaited<ReturnType<typeof ownedListing>>>;
type OwnedListingAccess = { current: ActionSession; existing: OwnedListing };

async function requireOwnedListing(
  listingId: string,
  { editable }: { editable: boolean },
): Promise<ListingResult<OwnedListingAccess>> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await getActionSession();
  if (!current) {
    return failure("unauthenticated");
  }
  const existing = await ownedListing(current, listingId);
  if (!existing) {
    return failure("not_found");
  }
  if (editable && existing.status === "hidden") {
    return failure("hidden");
  }
  return success({ current, existing });
}

const databaseErrorMarkers: ReadonlyArray<readonly [marker: string, code: ListingErrorCode]> = [
  ["PHONE_REQUIRED", "phone_required"],
  ["LISTING_LIMIT", "listing_limit"],
  ["PUBLISH_REQUIREMENTS", "publish_requirements"],
  ["IMAGE_LIMIT", "image_limit"],
  ["LAST_IMAGE", "last_image"],
  ["RENEW_NOT_ALLOWED", "renew_not_allowed"],
  ["NOT_FOUND", "not_found"],
];

function databaseErrorCode(message: string | undefined): ListingErrorCode {
  return databaseErrorMarkers.find(([marker]) => message?.includes(marker))?.[1] ?? "unexpected";
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

function toBasicsValues(data: z.output<typeof basicsSchema>) {
  return {
    type: data.type,
    title: data.title,
    description: data.description,
    price_km: data.priceKm,
    price_negotiable: data.priceNegotiable,
  };
}

type BasicsValues = ReturnType<typeof toBasicsValues>;

async function createListing(values: BasicsValues): Promise<ListingResult<{ id: string }>> {
  const current = await getActionSession();
  if (!current) {
    return failure("unauthenticated");
  }
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

async function updateBasics(listingId: string, values: BasicsValues): Promise<ListingResult<{ id: string }>> {
  const access = await requireOwnedListing(listingId, { editable: true });
  if (!access.ok) {
    return access;
  }
  const { current, existing } = access.data;
  const update: ListingUpdate =
    existing.type === values.type ? values : { ...clearedFieldsForType(values.type, existing.features), ...values };
  const { error } = await current.supabase.from("listings").update(update).eq("id", listingId);
  if (error) {
    return failure(databaseErrorCode(error.message));
  }
  revalidateListing(listingId);
  return success({ id: listingId });
}

export async function saveBasics(
  listingId: string | null,
  input: BasicsFormValues,
): Promise<ListingResult<{ id: string }>> {
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const values = toBasicsValues(parsed.data);
  return listingId === null ? createListing(values) : updateBasics(listingId, values);
}

export async function saveLocation(listingId: string, input: LocationFormValues): Promise<ListingResult> {
  const parsed = locationStepSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const access = await requireOwnedListing(listingId, { editable: true });
  if (!access.ok) {
    return access;
  }
  const { current } = access.data;

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
  const access = await requireOwnedListing(listingId, { editable: true });
  if (!access.ok) {
    return access;
  }
  const { current, existing } = access.data;
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

async function listImages(current: ActionSession, listingId: string): Promise<ListingImage[]> {
  const { data } = await current.supabase
    .from("listing_images")
    .select(listingImageColumns)
    .eq("listing_id", listingId)
    .order("position");
  return (data ?? []).map(toListingImage);
}

export async function registerImage(listingId: string, input: ImageRegistration): Promise<ListingResult<ListingImage>> {
  const parsed = imageRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const access = await requireOwnedListing(listingId, { editable: false });
  if (!access.ok) {
    return access;
  }
  const { current } = access.data;
  const expectedPrefix = `${current.userId}/${listingId}/`;
  const fileName = parsed.data.storagePath.slice(expectedPrefix.length);
  if (!parsed.data.storagePath.startsWith(expectedPrefix) || !/^[0-9a-f-]{36}\.webp$/.test(fileName)) {
    return failure("validation");
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
    .select(listingImageColumns)
    .single();
  if (error || !data) {
    await current.supabase.storage.from(listingImagesBucket).remove([parsed.data.storagePath]);
    return failure(databaseErrorCode(error?.message));
  }
  revalidateListing(listingId);
  return success(toListingImage(data));
}

export async function reorderImages(listingId: string, orderedImageIds: string[]): Promise<ListingResult> {
  const parsed = imageOrderSchema.safeParse(orderedImageIds);
  if (!parsed.success || !listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await getActionSession();
  if (!current) {
    return failure("unauthenticated");
  }
  const { error } = await current.supabase.rpc("reorder_listing_images", {
    target_listing_id: listingId,
    ordered_image_ids: parsed.data,
  });
  if (error) {
    return failure(databaseErrorCode(error.message));
  }
  revalidateListing(listingId);
  return success();
}

export async function deleteImage(listingId: string, imageId: string): Promise<ListingResult<ListingImage[]>> {
  if (!listingIdSchema.safeParse(listingId).success || !listingIdSchema.safeParse(imageId).success) {
    return failure("validation");
  }
  const current = await getActionSession();
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
  if (error) {
    return failure(databaseErrorCode(error.message));
  }
  if (!removed) {
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
  const current = await getActionSession();
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
  const current = await getActionSession();
  const listing = current && listingIdSchema.safeParse(listingId).success ? await ownedListing(current, listingId) : null;
  revalidateListing(listingId);
  const notice = listing?.status === "draft" ? listingNotices.draftSaved : listingNotices.saved;
  redirect(`${listingRoutes.mine}?${noticeParam}=${notice}`);
}

export async function renewListing(listingId: string): Promise<ListingResult<{ expiresAt: string }>> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return failure("validation");
  }
  const current = await getActionSession();
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

async function listFolder(current: ActionSession, folder: string): Promise<string[]> {
  const { data } = await current.supabase.storage.from(listingImagesBucket).list(folder, { limit: 1000 });
  return (data ?? []).filter((entry) => entry.id !== null).map((entry) => `${folder}/${entry.name}`);
}

export async function deleteListing(listingId: string): Promise<ListingResult> {
  const access = await requireOwnedListing(listingId, { editable: false });
  if (!access.ok) {
    return access;
  }
  const { current } = access.data;
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
