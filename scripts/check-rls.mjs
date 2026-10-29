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

  const { data: draft, error: draftError } = await userA.client
    .from("listings")
    .insert({ ...draftListing(userA.id), view_count: 500, expires_at: "2099-01-01T00:00:00Z" })
    .select("id, view_count, expires_at, status")
    .single();
  check("user can insert a draft", draftError === null && draft?.status === "draft", describeError(draftError));
  check("protected columns are reset on insert", draft?.view_count === 0 && draft?.expires_at === null);

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

  const { error: imageError } = await userA.client
    .from("listing_images")
    .insert({ listing_id: draft.id, storage_path: `${userA.id}/${draft.id}/cover.webp`, position: 0 });
  check("owner can add image rows", imageError === null, describeError(imageError));

  const { error: foreignImageError } = await userB.client
    .from("listing_images")
    .insert({ listing_id: draft.id, storage_path: `${userB.id}/${draft.id}/x.webp`, position: 1 });
  check("other user cannot add image rows", foreignImageError !== null, describeError(foreignImageError));

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

  const { error: viewError } = await anon.rpc("increment_listing_view", { listing_id: draft.id });
  const { data: afterView } = await admin.from("listings").select("view_count, updated_at").eq("id", draft.id).single();
  check("anon can increment views", viewError === null && afterView?.view_count === 1, describeError(viewError));

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
  const ownPath = `${userA.id}/${eleventh.id}/rls-test.webp`;
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

  const { error: anonUploadError } = await anon.storage
    .from("avatars")
    .upload(`${userA.id}/avatar.webp`, tinyWebp, { contentType: "image/webp" });
  check("anon cannot upload avatars", anonUploadError !== null, describeError(anonUploadError));
}

async function cleanUp() {
  if (uploadedPaths.length > 0) {
    await admin.storage.from("listing-images").remove(uploadedPaths);
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
