"use server";

import { redirect } from "next/navigation";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { toAuthErrorCode, type AuthErrorCode } from "@/lib/auth/auth-errors";
import { authRoutes, nextParam, noticeParam, notices } from "@/lib/auth/routes";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { siteOrigin } from "@/lib/auth/site-origin";
import { createClient } from "@/lib/supabase/server";
import {
  emailOnlySchema,
  newPasswordSchema,
  signInSchema,
  signUpSchema,
  type EmailOnlyInput,
  type NewPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation/auth";

type AuthResult<Data = undefined> = ActionResult<Data, AuthErrorCode>;

async function callbackUrl(next: string): Promise<string> {
  const url = new URL(authRoutes.callback, await siteOrigin());
  url.searchParams.set(nextParam, next);
  return url.toString();
}

export async function signIn(input: SignInInput, next?: string): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return failure(toAuthErrorCode(error));
    }
  } catch {
    return failure("network");
  }
  redirect(safeNextPath(next));
}

export async function signUp(input: SignUpInput): Promise<AuthResult<{ email: string }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: await callbackUrl(authRoutes.dashboard),
      },
    });
    if (error) {
      return failure(toAuthErrorCode(error));
    }
    return success({ email: parsed.data.email });
  } catch {
    return failure("network");
  }
}

export async function resendConfirmation(input: EmailOnlyInput): Promise<AuthResult> {
  const parsed = emailOnlySchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: { emailRedirectTo: await callbackUrl(authRoutes.dashboard) },
    });
    if (error) {
      return failure(toAuthErrorCode(error));
    }
    return success();
  } catch {
    return failure("network");
  }
}

export async function requestPasswordReset(input: EmailOnlyInput): Promise<AuthResult> {
  const parsed = emailOnlySchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: await callbackUrl(authRoutes.newPassword),
    });
    if (error && toAuthErrorCode(error) === "too_many_requests") {
      return failure("too_many_requests");
    }
    return success();
  } catch {
    return failure("network");
  }
}

export async function updatePassword(input: NewPasswordInput): Promise<AuthResult> {
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return failure("validation");
  }
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData?.claims) {
      return failure("session_missing");
    }
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      return failure(toAuthErrorCode(error));
    }
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    return failure("network");
  }
  redirect(`${authRoutes.login}?${noticeParam}=${notices.passwordChanged}`);
}

export async function signInWithGoogle(next?: string): Promise<AuthResult> {
  let providerUrl: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: await callbackUrl(safeNextPath(next)) },
    });
    if (error || !data.url) {
      return failure(error ? toAuthErrorCode(error) : "unexpected");
    }
    providerUrl = data.url;
  } catch {
    return failure("network");
  }
  redirect(providerUrl);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/?${noticeParam}=${notices.signedOut}`);
}
