import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  console.error("Run with: node --env-file=.env.local scripts/check-rls.mjs");
  process.exit(1);
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, secretKey, clientOptions);
const anon = createClient(url, publishableKey, clientOptions);

const runId = Date.now();
const password = `Rls-${runId}-check`;
const results = [];
const createdUserIds = [];
const uploadedPaths = [];
const uploadedAvatarPaths = [];

function check(name, passed, detail = "") {
  results.push({ name, passed });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${!passed && detail ? `  (${detail})` : ""}`);
}

function describeError(error) {
  return error ? `${error.code ?? ""} ${error.message}`.trim() : "no error";
}

async function createUser(label) {
  const email = `rls-${label}-${runId}@avlija.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Test ${label.toUpperCase()}` },
  });
  if (error) {
    throw new Error(`createUser ${label}: ${error.message}`);
  }
  createdUserIds.push(data.user.id);
  const client = createClient(url, publishableKey, clientOptions);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) {
    throw new Error(`signIn ${label}: ${signInError.message}`);
  }
  return { id: data.user.id, client };
}

const draftListing = (ownerId, title = "Testna kuća za provjeru pravila") => ({
  owner_id: ownerId,
  type: "kuca",
  title,
  municipality_id: 1,
  area_m2: 120,
});

async function insertImageRow(listingId, position = 0) {
  return admin.from("listing_images").insert({ listing_id: listingId, storage_path: `test/${listingId}/${position}.webp`, position });
}

async function makePublishable(listingId) {
  await insertImageRow(listingId);
  await admin.from("listings").update({ lat: 44.0559, lng: 17.4509, price_km: 150000 }).eq("id", listingId);
}

async function run() {
  const userA = await createUser("a");
  const userB = await createUser("b");

  const { data: municipalities } = await anon.from("municipalities").select("id");
  check("anon reads 12 municipalities", municipalities?.length === 12, `got ${municipalities?.length}`);

  const { data: profileA } = await admin.from("profiles").select("full_name, role").eq("id", userA.id).single();
  const { data: contactsA } = await admin.from("profile_contacts").select("profile_id").eq("profile_id", userA.id);
  check("sign-up trigger creates profile with full_name", profileA?.full_name === "Test A" && profileA?.role === "user");
  check("sign-up trigger creates empty profile_contacts row", contactsA?.length === 1);

  const { error: roleError } = await userA.client.from("profiles").update({ role: "admin" }).eq("id", userA.id);
  check("user cannot change own role", roleError !== null, describeError(roleError));

  const { error: nameError } = await userA.client.from("profiles").update({ full_name: "Test A Izmijenjen" }).eq("id", userA.id);
  check("user can change own full_name", nameError === null, describeError(nameError));

  const { error: contactError } = await userA.client
    .from("profile_contacts")
    .update({ phone: "+387 61 111 222", has_viber: true })
    .eq("profile_id", userA.id);
  check("user can set own phone", contactError === null, describeError(contactError));

  const { data: anonContacts } = await anon.from("profile_contacts").select("*");
  check("anon cannot read profile_contacts", (anonContacts ?? []).length === 0);

  const { data: contactsSeenByB } = await userB.client.from("profile_contacts").select("profile_id");
  check(
    "logged-in user reads only own profile_contacts row",
    contactsSeenByB?.length === 1 && contactsSeenByB[0].profile_id === userB.id,
    JSON.stringify(contactsSeenByB),
  );

  const { error: activeInsertError } = await userA.client.from("listings").insert({ ...draftListing(userA.id), status: "active" });
  check("user cannot insert a listing directly as active", activeInsertError !== null, describeError(activeInsertError));

  const { error: protectedInsertError } = await userA.client
    .from("listings")
    .insert({ ...draftListing(userA.id), view_count: 500, expires_at: "2099-01-01T00:00:00Z" });
  check("protected columns cannot be set on insert", protectedInsertError !== null, describeError(protectedInsertError));

  const { error: numberInsertError } = await userA.client.from("listings").insert({ ...draftListing(userA.id), number: 999999 });
  check("listing number cannot be chosen on insert", numberInsertError !== null, describeError(numberInsertError));

  const { data: draft, error: draftError } = await userA.client
    .from("listings")
    .insert(draftListing(userA.id))
    .select("id, view_count, expires_at, status")
    .single();
  check("user can insert a draft", draftError === null && draft?.status === "draft", describeError(draftError));
  check("protected columns start empty on insert", draft?.view_count === 0 && draft?.expires_at === null);

  const { error: draftToSoldError } = await userA.client.from("listings").update({ status: "sold" }).eq("id", draft.id);
  check(
    "owner cannot mark a draft as sold",
    draftToSoldError?.message?.includes("STATUS_TRANSITION") === true,
    describeError(draftToSoldError),
  );

  const { data: anonDraft } = await anon.from("listings").select("id").eq("id", draft.id);
  check("anon cannot read drafts", (anonDraft ?? []).length === 0);

  const { data: otherUserDraft } = await userB.client.from("listings").select("id").eq("id", draft.id);
  check("other user cannot read drafts", (otherUserDraft ?? []).length === 0);

  const { error: publishEarlyError } = await userA.client.from("listings").update({ status: "active" }).eq("id", draft.id);
  check(
    "publishing without image, location and price is rejected",
    publishEarlyError?.message?.includes("PUBLISH_REQUIREMENTS") === true,
    describeError(publishEarlyError),
  );

  const addImage = (user, listingId, path = `${user.id}/${listingId}/${crypto.randomUUID()}.webp`) =>
    user.client.rpc("add_listing_image", { target_listing_id: listingId, image_path: path, image_width: 800, image_height: 600 });

  const { error: imageError } = await addImage(userA, draft.id);
  check("owner can add images through add_listing_image", imageError === null, describeError(imageError));

  const { error: directInsertError } = await userA.client
    .from("listing_images")
    .insert({ listing_id: draft.id, storage_path: `${userA.id}/${draft.id}/${crypto.randomUUID()}.webp`, position: 5 });
  check("image rows cannot be inserted directly", directInsertError !== null, describeError(directInsertError));

  const { error: foreignPathError } = await addImage(userA, draft.id, `${userB.id}/other/${crypto.randomUUID()}.webp`);
  check("image paths must point into the owner's listing folder", foreignPathError?.message?.includes("INVALID_IMAGE") === true, describeError(foreignPathError));

  const { error: pngPathError } = await addImage(userA, draft.id, `${userA.id}/${draft.id}/${crypto.randomUUID()}.png`);
  check("image paths must end in .webp or .jpg", pngPathError?.message?.includes("INVALID_IMAGE") === true, describeError(pngPathError));

  const { error: foreignImageError } = await addImage(userB, draft.id, `${userB.id}/${draft.id}/${crypto.randomUUID()}.webp`);
  check("other user cannot add images", foreignImageError?.message?.includes("NOT_FOUND") === true, describeError(foreignImageError));

  const { data: photoDraft } = await userA.client
    .from("listings")
    .insert(draftListing(userA.id, "Testna kuća za paralelne slike"))
    .select("id")
    .single();
  const parallel = await Promise.all([addImage(userA, photoDraft.id), addImage(userA, photoDraft.id), addImage(userA, photoDraft.id)]);
  const parallelPositions = parallel.map((result) => result.data?.position);
  check(
    "parallel image adds all succeed with distinct positions",
    parallel.every((result) => result.error === null) && new Set(parallelPositions).size === 3,
    parallel.map((result) => describeError(result.error)).join(" | "),
  );

  const { error: unknownFeatureError } = await userA.client
    .from("listings")
    .update({ features: ["balkon", "helikopter"] })
    .eq("id", draft.id);
  check("unknown features are rejected", unknownFeatureError !== null, describeError(unknownFeatureError));

  await userA.client.from("listings").update({ lat: 44.0559, lng: 17.4509, price_km: 185000 }).eq("id", draft.id);
  const { data: published, error: publishError } = await userA.client
    .from("listings")
    .update({ status: "active", view_count: 999 })
    .eq("id", draft.id)
    .select("status, view_count, published_at, expires_at")
    .single();
  check("complete listing can be published", publishError === null && published?.status === "active", describeError(publishError));
  check("view_count cannot be set by owner", published?.view_count === 0);
  const expiryDays = published?.expires_at
    ? Math.round((new Date(published.expires_at).getTime() - Date.now()) / 86_400_000)
    : null;
  check("publishing sets published_at and a 90-day expiry", Boolean(published?.published_at) && expiryDays === 90, `expiry in ${expiryDays} days`);

  await userA.client.from("listings").update({ price_km: 195000 }).eq("id", draft.id);
  const { data: reduced } = await userA.client
    .from("listings")
    .update({ price_km: 175000, previous_price_km: 999999 })
    .eq("id", draft.id)
    .select("price_km, previous_price_km, price_reduced_at")
    .single();
  check(
    "price drop is measured from the price before the last 30 days of changes",
    reduced?.previous_price_km === 185000 && Boolean(reduced?.price_reduced_at),
    JSON.stringify(reduced),
  );
  const { data: history } = await anon.from("listing_price_history").select("old_price_km, new_price_km").eq("listing_id", draft.id);
  check("price changes are recorded and publicly readable", history?.length === 2, `got ${history?.length}`);
  const { error: historyInsertError } = await userA.client
    .from("listing_price_history")
    .insert({ listing_id: draft.id, old_price_km: 1, new_price_km: 2 });
  check("users cannot write price history", historyInsertError !== null, describeError(historyInsertError));

  const { data: phonelessDraft } = await userB.client
    .from("listings")
    .insert(draftListing(userB.id, "Oglas korisnika bez telefona"))
    .select("id")
    .single();
  await makePublishable(phonelessDraft.id);
  const { error: phoneError } = await userB.client.from("listings").update({ status: "active" }).eq("id", phonelessDraft.id);
  check(
    "publishing without a phone number is rejected",
    phoneError?.message?.includes("PHONE_REQUIRED") === true,
    describeError(phoneError),
  );

  const { data: anonActive } = await anon.from("listings").select("id").eq("id", draft.id);
  const { data: anonImages } = await anon.from("listing_images").select("id").eq("listing_id", draft.id);
  check("anon reads active listing and its images", anonActive?.length === 1 && anonImages?.length === 1);

  const { data: anonSellerA } = await anon.from("profiles").select("id").eq("id", userA.id);
  const { data: anonProfileB } = await anon.from("profiles").select("id").eq("id", userB.id);
  check("anon reads profiles of sellers with public listings", anonSellerA?.length === 1);
  check("anon cannot read profiles of users without public listings", (anonProfileB ?? []).length === 0);

  const { data: lastImage } = await userA.client.from("listing_images").select("id").eq("listing_id", draft.id).single();
  const { error: lastImageError } = await userA.client.from("listing_images").delete().eq("id", lastImage.id);
  check(
    "owner cannot delete the last image of an active listing",
    lastImageError?.message?.includes("LAST_IMAGE") === true,
    describeError(lastImageError),
  );

  const { data: exactLocation } = await admin.from("listings").select("lat, public_lat").eq("id", draft.id).single();
  check("approximate location differs from the exact one", exactLocation?.lat !== exactLocation?.public_lat);

  const { error: anonInsertError } = await anon.from("listings").insert(draftListing(userA.id));
  check("anon cannot insert listings", anonInsertError !== null, describeError(anonInsertError));

  const { data: anonUpdated } = await anon.from("listings").update({ title: "Anon promijenio naslov" }).eq("id", draft.id).select("id");
  check("anon cannot update listings", (anonUpdated ?? []).length === 0);

  const { data: otherUpdated } = await userB.client.from("listings").update({ title: "Drugi korisnik mijenja" }).eq("id", draft.id).select("id");
  check("other user cannot update listings", (otherUpdated ?? []).length === 0);

  const { error: anonFavoriteError } = await anon.from("favorites").insert({ user_id: userB.id, listing_id: draft.id });
  check("anon cannot insert favorites", anonFavoriteError !== null, describeError(anonFavoriteError));

  const { error: favoriteError } = await userB.client.from("favorites").insert({ user_id: userB.id, listing_id: draft.id });
  check("user can favourite a listing", favoriteError === null, describeError(favoriteError));

  const { data: favoritesSeenByA } = await userA.client.from("favorites").select("user_id");
  check("user cannot see other users' favourites", (favoritesSeenByA ?? []).length === 0);

  const { error: anonReportError } = await anon.from("reports").insert({ listing_id: draft.id, reason: "ostalo" });
  check("anon cannot report", anonReportError !== null, describeError(anonReportError));

  const { error: resolvedReportError } = await userB.client
    .from("reports")
    .insert({ listing_id: draft.id, reporter_id: userB.id, reason: "ostalo", status: "resolved" });
  check("user cannot file a pre-resolved report", resolvedReportError !== null, describeError(resolvedReportError));

  const { error: reportError } = await userB.client
    .from("reports")
    .insert({ listing_id: draft.id, reporter_id: userB.id, reason: "netacni_podaci", details: "Test" });
  check("user can report a listing", reportError === null, describeError(reportError));

  const { data: reportsSeenByB } = await userB.client.from("reports").select("id");
  check("non-admin cannot read reports", (reportsSeenByB ?? []).length === 0);

  const { data: anonContact, error: anonContactError } = await anon.rpc("get_seller_contact", { listing_id: draft.id });
  check("anon cannot reveal seller contact", anonContactError !== null || (anonContact ?? []).length === 0, describeError(anonContactError));

  const { data: revealed, error: revealError } = await userB.client.rpc("get_seller_contact", { listing_id: draft.id });
  check(
    "logged-in user reveals seller contact via RPC",
    revealError === null && revealed?.[0]?.phone === "+387 61 111 222" && revealed?.[0]?.has_viber === true,
    describeError(revealError),
  );

  const { data: statsForA, error: statsError } = await userA.client.rpc("my_listing_stats");
  const draftStats = statsForA?.find((entry) => entry.listing_id === draft.id);
  check(
    "owner sees favourite and contact counts for own listing",
    statsError === null && draftStats?.favorite_count === 1 && draftStats?.contact_count === 1,
    describeError(statsError) || JSON.stringify(draftStats),
  );
  const { data: statsForB } = await userB.client.rpc("my_listing_stats");
  check("stats never include other owners' listings", !(statsForB ?? []).some((entry) => entry.listing_id === draft.id));
  const { error: anonStatsError } = await anon.rpc("my_listing_stats");
  check("anon cannot call listing stats", anonStatsError !== null, describeError(anonStatsError));

  const { data: revealsSeenByB, error: revealsError } = await userB.client.from("contact_reveals").select("id");
  check(
    "users cannot read the contact reveal log",
    revealsError !== null || (revealsSeenByB ?? []).length === 0,
    describeError(revealsError),
  );

  const { error: anonViewError } = await anon.rpc("increment_listing_view", { listing_id: draft.id, visitor_hash: "a".repeat(64) });
  check("anon cannot call increment_listing_view", anonViewError !== null, describeError(anonViewError));

  const visitor = "b".repeat(64);
  await admin.rpc("increment_listing_view", { listing_id: draft.id, visitor_hash: visitor });
  await admin.rpc("increment_listing_view", { listing_id: draft.id, visitor_hash: visitor });
  const { data: afterView } = await admin.from("listings").select("view_count, updated_at").eq("id", draft.id).single();
  check("the same visitor is counted once per day", afterView?.view_count === 1, `view_count ${afterView?.view_count}`);

  const { error: renewError } = await userA.client.rpc("renew_listing", { listing_id: draft.id });
  check(
    "renew is refused while more than 14 days remain",
    renewError?.message?.includes("RENEW_NOT_ALLOWED") === true,
    describeError(renewError),
  );

  await admin.from("listings").update({ status: "archived" }).eq("id", draft.id);
  const { data: renewedExpiry, error: renewArchivedError } = await userA.client.rpc("renew_listing", { listing_id: draft.id });
  const { data: afterRenew } = await admin.from("listings").select("status").eq("id", draft.id).single();
  check(
    "archived listing can be renewed by owner",
    renewArchivedError === null && afterRenew?.status === "active" && Boolean(renewedExpiry),
    describeError(renewArchivedError),
  );

  const { error: foreignRenewError } = await userB.client.rpc("renew_listing", { listing_id: draft.id });
  check("other user cannot renew", foreignRenewError !== null, describeError(foreignRenewError));

  await admin.from("listings").update({ status: "hidden", hidden_reason: "Test" }).eq("id", draft.id);
  const { data: unhidden } = await userA.client.from("listings").update({ status: "active" }).eq("id", draft.id).select("id");
  check("owner cannot un-hide a hidden listing", (unhidden ?? []).length === 0);
  await admin.from("listings").update({ status: "active", hidden_reason: null }).eq("id", draft.id);

  for (let index = 0; index < 9; index += 1) {
    const { data: extra } = await admin
      .from("listings")
      .insert(draftListing(userA.id, `Dodatni testni oglas broj ${index + 1}`))
      .select("id")
      .single();
    await makePublishable(extra.id);
    await admin.from("listings").update({ status: "active" }).eq("id", extra.id);
  }
  const { count: activeCount } = await admin
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userA.id)
    .eq("status", "active");
  check("setup: owner has 10 active listings", activeCount === 10, `got ${activeCount}`);

  const { data: eleventh } = await userA.client
    .from("listings")
    .insert(draftListing(userA.id, "Jedanaesti testni oglas"))
    .select("id")
    .single();
  await makePublishable(eleventh.id);
  const { error: limitError } = await userA.client.from("listings").update({ status: "active" }).eq("id", eleventh.id);
  check("11th active listing is rejected", limitError?.message?.includes("LISTING_LIMIT") === true, describeError(limitError));

  const tinyWebp = Buffer.from("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==", "base64");
  const tinyJpeg = Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==", "base64");
  const ownPath = `${userA.id}/${eleventh.id}/${crypto.randomUUID()}.webp`;
  const { error: ownUploadError } = await userA.client.storage
    .from("listing-images")
    .upload(ownPath, tinyWebp, { contentType: "image/webp" });
  if (!ownUploadError) {
    uploadedPaths.push(ownPath);
  }
  check("owner can upload to own listing folder", ownUploadError === null, describeError(ownUploadError));

  const { error: foreignUploadError } = await userB.client.storage
    .from("listing-images")
    .upload(`${userA.id}/${eleventh.id}/intruder.webp`, tinyWebp, { contentType: "image/webp" });
  check("other user cannot upload into owner's folder", foreignUploadError !== null, describeError(foreignUploadError));

  const { error: wrongListingUploadError } = await userB.client.storage
    .from("listing-images")
    .upload(`${userB.id}/${eleventh.id}/not-mine.webp`, tinyWebp, { contentType: "image/webp" });
  check("user cannot upload for someone else's listing id", wrongListingUploadError !== null, describeError(wrongListingUploadError));

  const { error: badNameUploadError } = await userA.client.storage
    .from("listing-images")
    .upload(`${userA.id}/${eleventh.id}/anything.webp`, tinyWebp, { contentType: "image/webp" });
  check("listing image files must be named <uuid>.webp", badNameUploadError !== null, describeError(badNameUploadError));

  const jpegPath = `${userA.id}/${eleventh.id}/${crypto.randomUUID()}.jpg`;
  const { error: jpegUploadError } = await userA.client.storage
    .from("listing-images")
    .upload(jpegPath, tinyJpeg, { contentType: "image/jpeg" });
  if (!jpegUploadError) {
    uploadedPaths.push(jpegPath);
  }
  check("owner can upload a <uuid>.jpg listing image", jpegUploadError === null, describeError(jpegUploadError));

  const { error: jpegRegisterError } = await userA.client.rpc("add_listing_image", {
    target_listing_id: eleventh.id,
    image_path: jpegPath,
    image_width: 800,
    image_height: 600,
  });
  check("owner can register a .jpg image through add_listing_image", jpegRegisterError === null, describeError(jpegRegisterError));

  const { error: pngUploadError } = await userA.client.storage
    .from("listing-images")
    .upload(`${userA.id}/${eleventh.id}/${crypto.randomUUID()}.webp`, tinyWebp, { contentType: "image/png" });
  check("listing image files must be image/webp or image/jpeg", pngUploadError !== null, describeError(pngUploadError));

  const { error: pngNameUploadError } = await userA.client.storage
    .from("listing-images")
    .upload(`${userA.id}/${eleventh.id}/${crypto.randomUUID()}.png`, tinyWebp, { contentType: "image/webp" });
  check("listing image files must end in .webp or .jpg", pngNameUploadError !== null, describeError(pngNameUploadError));

  const { error: ownAvatarError } = await userA.client.storage
    .from("avatars")
    .upload(`${userA.id}/avatar.webp`, tinyWebp, { contentType: "image/webp", upsert: true });
  if (!ownAvatarError) {
    uploadedAvatarPaths.push(`${userA.id}/avatar.webp`);
  }
  check("user can upload own avatar", ownAvatarError === null, describeError(ownAvatarError));

  const { error: extraAvatarError } = await userA.client.storage
    .from("avatars")
    .upload(`${userA.id}/extra.webp`, tinyWebp, { contentType: "image/webp" });
  check("avatar folder only accepts avatar.webp or avatar.jpg", extraAvatarError !== null, describeError(extraAvatarError));

  const { error: jpegAvatarError } = await userA.client.storage
    .from("avatars")
    .upload(`${userA.id}/avatar.jpg`, tinyJpeg, { contentType: "image/jpeg", upsert: true });
  if (!jpegAvatarError) {
    uploadedAvatarPaths.push(`${userA.id}/avatar.jpg`);
  }
  check("user can upload own avatar as JPEG", jpegAvatarError === null, describeError(jpegAvatarError));

  const { error: anonUploadError } = await anon.storage
    .from("avatars")
    .upload(`${userA.id}/avatar.webp`, tinyWebp, { contentType: "image/webp" });
  check("anon cannot upload avatars", anonUploadError !== null, describeError(anonUploadError));

  await checkAiSuggestionLimit(userA, userB);
}

async function countAiSuggestions(userId) {
  const { count } = await admin.from("ai_suggestions").select("id", { count: "exact", head: true }).eq("user_id", userId);
  return count ?? 0;
}

async function checkAiSuggestionLimit(userA, userB) {
  const { error: anonClaimError } = await anon.rpc("claim_ai_suggestion");
  check("anon cannot claim an AI suggestion", anonClaimError !== null, describeError(anonClaimError));

  const { data: firstToken, error: firstClaimError } = await userA.client.rpc("claim_ai_suggestion");
  check(
    "user can claim an AI suggestion and gets a release token",
    firstClaimError === null && typeof firstToken === "string" && firstToken.length === 36,
    describeError(firstClaimError),
  );

  const { data: visibleRows } = await userA.client.from("ai_suggestions").select("id");
  check("users cannot read ai_suggestions", (visibleRows ?? []).length === 0);

  const { error: directInsertError } = await userA.client.from("ai_suggestions").insert({ user_id: userA.id });
  check("users cannot insert ai_suggestions directly", directInsertError !== null, describeError(directInsertError));

  await userB.client.rpc("release_ai_suggestion", { token: firstToken });
  check("other user cannot release someone else's claim", (await countAiSuggestions(userA.id)) === 1);

  const { error: releaseError } = await userA.client.rpc("release_ai_suggestion", { token: firstToken });
  check(
    "owner can release a failed claim",
    releaseError === null && (await countAiSuggestions(userA.id)) === 0,
    describeError(releaseError),
  );

  const claims = [];
  for (let attempt = 0; attempt < 10; attempt += 1) {
    claims.push(await userA.client.rpc("claim_ai_suggestion"));
  }
  check(
    "10 AI suggestions per day are allowed",
    claims.every((claim) => claim.error === null),
    claims.map((claim) => describeError(claim.error)).join(", "),
  );

  const { error: overLimitError } = await userA.client.rpc("claim_ai_suggestion");
  check(
    "11th AI suggestion within a day is rejected",
    overLimitError?.message?.includes("RATE_LIMIT") === true,
    describeError(overLimitError),
  );

  const { error: otherUserClaimError } = await userB.client.rpc("claim_ai_suggestion");
  check("the AI limit is counted per user", otherUserClaimError === null, describeError(otherUserClaimError));
}

async function cleanUp() {
  if (uploadedPaths.length > 0) {
    await admin.storage.from("listing-images").remove(uploadedPaths);
  }
  if (uploadedAvatarPaths.length > 0) {
    await admin.storage.from("avatars").remove(uploadedAvatarPaths);
  }
  for (const id of createdUserIds) {
    await admin.auth.admin.deleteUser(id);
  }
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).in("id", createdUserIds);
  console.log(`\nCleanup: ${createdUserIds.length} test users deleted, ${count ?? 0} profiles left.`);
}

try {
  await run();
} catch (error) {
  check("script ran to completion", false, error instanceof Error ? error.message : String(error));
} finally {
  await cleanUp();
}

const failed = results.filter((result) => !result.passed);
console.log(`${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length > 0 ? 1 : 0);
