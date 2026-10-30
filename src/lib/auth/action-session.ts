import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getActionSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims ? { supabase, userId: claims.sub, email: claims.email ?? "" } : null;
}

export type ActionSession = NonNullable<Awaited<ReturnType<typeof getActionSession>>>;

export async function getAdminSession(): Promise<ActionSession | null> {
  const session = await getActionSession();
  if (!session) {
    return null;
  }
  const { data } = await session.supabase.from("profiles").select("role").eq("id", session.userId).maybeSingle();
  return data?.role === "admin" ? session : null;
}
