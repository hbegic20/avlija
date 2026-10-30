import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { FavoritesSync } from "./favorites-sync";

export async function FavoritesLoader() {
  const user = await getCurrentUser();
  if (!user) {
    return <FavoritesSync loggedIn={false} ids={[]} />;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", user.id);
  return <FavoritesSync loggedIn ids={(data ?? []).map((row) => row.listing_id)} />;
}
