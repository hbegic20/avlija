import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { supabasePublishableKey, supabaseUrl } from "./env";

export type SessionClaims = {
  sub: string;
  email?: string;
  role?: string;
};

export type SessionResult = {
  response: NextResponse;
  claims: SessionClaims | null;
};

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  return {
    response,
    claims: claims ? { sub: claims.sub, email: claims.email, role: claims.role } : null,
  };
}
