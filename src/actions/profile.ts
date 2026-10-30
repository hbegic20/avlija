"use server";

import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth/action-session";
import { toAuthErrorCode } from "@/lib/auth/auth-errors";
import { authRoutes, nextParam, noticeParam, notices } from "@/lib/auth/routes";
import type { ProfileErrorCode } from "@/lib/profile/profile-errors";
import { siteOrigin } from "@/lib/auth/site-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";
import { avatarsBucket, listingImagesBucket } from "@/lib/supabase/storage-url";
import {
  avatarPathFor,
  basicInfoSchema,
  changeEmailSchema,
  changePasswordSchema,
  contactSchema,
  deleteAccountSchema,
  type BasicInfoInput,
  type ChangeEmailInput,
  type ChangePasswordInput,
  type ContactInput,
  type DeleteAccountInput,
} from "@/lib/validation/profile";

type ProfileResult<Data = undefined> = ActionResult<Data, ProfileErrorCode>;


function revalidateProfile() {
  revalidatePath(authRoutes.profile);
  revalidatePath("/", "layout");
}

export async function updateBasicInfo(input: BasicInfoInput): Promise<ProfileResult> {
  const parsed = basicInfoSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const session = await getActionSession();
  if (!session) {
    return failure("unauthenticated");
  }
  const { error } = await session.supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      municipality_id: parsed.data.municipalityId === "" ? null : Number(parsed.data.municipalityId),
    })
    .eq("id", session.userId);
  if (error) {
    return failure("unexpected");
  }
  revalidateProfile();
  return success();
}

export async function updateAvatar(storagePath: string | null): Promise<ProfileResult<{ avatarUrl: string | null }>> {
  const session = await getActionSession();
  if (!session) {
    return failure("unauthenticated");
  }
  const expectedPath = avatarPathFor(session.userId);
  if (storagePath !== null && storagePath !== expectedPath) {
    return failure("validation");
  }

  let avatarUrl: string | null = null;
  if (storagePath === null) {
    await session.supabase.storage.from(avatarsBucket).remove([expectedPath]);
  } else {
    const { data } = session.supabase.storage.from(avatarsBucket).getPublicUrl(expectedPath);
    avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  }

  const { error } = await session.supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", session.userId);
  if (error) {
    return failure("unexpected");
  }
  revalidateProfile();
  return success({ avatarUrl });
}

export async function updateContacts(input: ContactInput): Promise<ProfileResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const session = await getActionSession();
  if (!session) {
    return failure("unauthenticated");
  }
  const phone = parsed.data.phone === "" ? null : parsed.data.phone;

  if (phone === null) {
    const { count } = await session.supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", session.userId)
      .eq("status", "active");
    if ((count ?? 0) > 0) {
      return failure("phone_needed_for_active");
    }
  }

  const { error } = await session.supabase
    .from("profile_contacts")
    .update({ phone, has_viber: parsed.data.hasViber, has_whatsapp: parsed.data.hasWhatsapp })
    .eq("profile_id", session.userId);
  if (error) {
    return failure("unexpected");
  }
  revalidateProfile();
  return success();
}

export async function changePassword(input: ChangePasswordInput): Promise<ProfileResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const session = await getActionSession();
  if (!session) {
    return failure("unauthenticated");
  }
  try {
    const verifier = createStatelessClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: session.email,
      password: parsed.data.currentPassword,
    });
    if (verifyError) {
      const code = toAuthErrorCode(verifyError);
      return failure(code === "invalid_credentials" ? "wrong_current_password" : code);
    }
    await verifier.auth.signOut({ scope: "local" });

    const { error } = await session.supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      return failure(toAuthErrorCode(error));
    }
    return success();
  } catch {
    return failure("network");
  }
}

export async function changeEmail(input: ChangeEmailInput): Promise<ProfileResult> {
  const parsed = changeEmailSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const session = await getActionSession();
  if (!session) {
    return failure("unauthenticated");
  }
  if (parsed.data.email === session.email.toLowerCase()) {
    return failure("same_email");
  }
  try {
    const redirectTo = new URL(authRoutes.callback, await siteOrigin());
    redirectTo.searchParams.set(nextParam, authRoutes.profile);
    const { error } = await session.supabase.auth.updateUser(
      { email: parsed.data.email },
      { emailRedirectTo: redirectTo.toString() },
    );
    if (error) {
      if (error.code === "email_exists" || error.code === "user_already_exists") {
        return failure("email_taken");
      }
      return failure(toAuthErrorCode(error));
    }
    return success();
  } catch {
    return failure("network");
  }
}

async function listAllPaths(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  const entries = data ?? [];
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.id === null ? listAllPaths(admin, bucket, `${prefix}/${entry.name}`) : Promise.resolve([`${prefix}/${entry.name}`]),
    ),
  );
  return nested.flat();
}

async function removeUserFiles(admin: ReturnType<typeof createAdminClient>, userId: string) {
  for (const bucket of [listingImagesBucket, avatarsBucket]) {
    const paths = await listAllPaths(admin, bucket, userId);
    for (let start = 0; start < paths.length; start += 100) {
      await admin.storage.from(bucket).remove(paths.slice(start, start + 100));
    }
  }
}

export async function deleteAccount(input: DeleteAccountInput): Promise<ProfileResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  const session = await getActionSession();
  if (!session) {
    return failure("unauthenticated");
  }
  try {
    const admin = createAdminClient();
    await removeUserFiles(admin, session.userId);
    const { error } = await admin.auth.admin.deleteUser(session.userId);
    if (error) {
      return failure("unexpected");
    }
    await session.supabase.auth.signOut({ scope: "local" });
  } catch {
    return failure("unexpected");
  }
  redirect(`/?${noticeParam}=${notices.accountDeleted}`);
}
