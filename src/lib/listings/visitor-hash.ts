import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { readSecretKey } from "@/lib/supabase/env";

function clientIp(requestHeaders: Headers): string {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || "unknown";
}

export async function visitorHash(userId: string | null): Promise<string> {
  const requestHeaders = await headers();
  const identity = userId
    ? `user:${userId}`
    : `visitor:${clientIp(requestHeaders)}|${requestHeaders.get("user-agent") ?? ""}`;
  return createHmac("sha256", readSecretKey()).update(identity).digest("hex");
}
