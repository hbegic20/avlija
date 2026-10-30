import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { loginPathWithNext } from "@/lib/auth/routes";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { addFavoriteParams, favoritesRoutes, isListingId } from "@/lib/favorites/routes";
import { getActionSession } from "@/lib/auth/action-session";

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get(addFavoriteParams.listing);
  const back = safeNextPath(request.nextUrl.searchParams.get(addFavoriteParams.back), favoritesRoutes.page);

  const session = await getActionSession();
  if (!session) {
    return NextResponse.redirect(new URL(loginPathWithNext(`${request.nextUrl.pathname}${request.nextUrl.search}`), request.url));
  }

  if (isListingId(listingId)) {
    await session.supabase
      .from("favorites")
      .upsert({ user_id: session.userId, listing_id: listingId }, { onConflict: "user_id,listing_id", ignoreDuplicates: true });
    revalidatePath(favoritesRoutes.page);
  }

  return NextResponse.redirect(new URL(back, request.url));
}
