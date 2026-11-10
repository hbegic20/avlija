import { NextResponse, type NextRequest } from "next/server";
import { authRoutes, guestOnlyPaths, loginPathWithNext, matchesPrefix, nextParam, protectedPrefixes } from "@/lib/auth/routes";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { goneResponseBody } from "@/lib/listings/gone-response";
import { checkListingRoute, isListingPath, type ListingRouteCheck } from "@/lib/listings/listing-route-check";
import { isMissingSellerPath, isSellerPath } from "@/lib/listings/seller-route-check";
import { isUnknownMunicipalityPath, notFoundRewritePath } from "@/lib/search/municipality-path";
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

function notFoundRewrite(request: NextRequest): NextResponse {
  return NextResponse.rewrite(new URL(notFoundRewritePath, request.url));
}

function listingRouteResponse(request: NextRequest, check: ListingRouteCheck): NextResponse | null {
  switch (check.kind) {
    case "pass":
      return null;
    case "missing":
      return notFoundRewrite(request);
    case "gone":
      return new NextResponse(goneResponseBody(), {
        status: 410,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    case "redirect": {
      const location = new URL(check.location, request.url);
      location.search = request.nextUrl.search;
      return NextResponse.redirect(location, 308);
    }
  }
}

async function publicRouteResponse(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (isUnknownMunicipalityPath(pathname)) {
    return notFoundRewrite(request);
  }
  if (isListingPath(pathname)) {
    return listingRouteResponse(request, await checkListingRoute(pathname));
  }
  if (isSellerPath(pathname) && (await isMissingSellerPath(pathname))) {
    return notFoundRewrite(request);
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const publicResponse = await publicRouteResponse(request);
  if (publicResponse) {
    return publicResponse;
  }

  const { response, claims } = await updateSession(request);

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
