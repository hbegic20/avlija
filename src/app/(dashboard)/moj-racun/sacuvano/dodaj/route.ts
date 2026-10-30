import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { loginPathWithNext } from "@/lib/auth/routes";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { addFavoriteParams, favoritesRoutes, isListingId } from "@/lib/favorites/routes";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get(addFavoriteParams.listing);
  const back = safeNextPath(request.nextUrl.searchParams.get(addFavoriteParams.back), favoritesRoutes.page);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.redirect(new URL(loginPathWithNext(`${request.nextUrl.pathname}${request.nextUrl.search}`), request.url));
  }

  if (isListingId(listingId)) {
    await supabase
      .from("favorites")
      .upsert({ user_id: userId, listing_id: listingId }, { onConflict: "user_id,listing_id", ignoreDuplicates: true });
    revalidatePath(favoritesRoutes.page);
  }

  return NextResponse.redirect(new URL(back, request.url));
}
