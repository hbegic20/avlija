import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { readSecretKey, supabaseUrl } from "./env";

export function createAdminClient() {
  return createClient<Database>(supabaseUrl, readSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
