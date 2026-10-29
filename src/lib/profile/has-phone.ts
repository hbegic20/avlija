import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function hasPhone(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("profile_contacts").select("phone").eq("profile_id", userId).maybeSingle();
  return Boolean(data?.phone);
}
