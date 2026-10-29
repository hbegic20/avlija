import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { authRoutes, nextParam, noticeParam, notices } from "@/lib/auth/routes";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

const emailOtpTypes: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (emailOtpTypes as readonly string[]).includes(value);
}

function invalidLinkRedirect(request: NextRequest, type: string | null): NextResponse {
  const target = type === "recovery" ? authRoutes.newPassword : authRoutes.login;
  return NextResponse.redirect(new URL(`${target}?${noticeParam}=${notices.linkInvalid}`, request.url));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const fallback = type === "recovery" ? authRoutes.newPassword : authRoutes.dashboard;
  const next = safeNextPath(searchParams.get(nextParam), fallback);

  const supabase = await createClient();

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    return invalidLinkRedirect(request, type);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return invalidLinkRedirect(request, type);
}
