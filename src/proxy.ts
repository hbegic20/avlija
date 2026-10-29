import { NextResponse, type NextRequest } from "next/server";
import { authRoutes, guestOnlyPaths, loginPathWithNext, matchesPrefix, nextParam, protectedPrefixes } from "@/lib/auth/routes";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { updateSession } from "@/lib/supabase/session";

function redirectKeepingCookies(request: NextRequest, sessionResponse: NextResponse, location: string): NextResponse {
  const redirect = NextResponse.redirect(new URL(location, request.url));
  for (const cookie of sessionResponse.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  sessionResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "cache-control") {
      redirect.headers.set(key, value);
    }
  });
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { response, claims } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
  if (isProtected && !claims) {
    return redirectKeepingCookies(request, response, loginPathWithNext(`${pathname}${search}`));
  }

  const isGuestOnly = guestOnlyPaths.some((path) => pathname === path);
  if (isGuestOnly && claims) {
    const next = safeNextPath(request.nextUrl.searchParams.get(nextParam), authRoutes.dashboard);
    return redirectKeepingCookies(request, response, next);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)"],
};
