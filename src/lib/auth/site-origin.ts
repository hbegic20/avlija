import "server-only";
import { headers } from "next/headers";
import { authRoutes, nextParam } from "./routes";

async function siteOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) {
    return origin;
  }
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function authCallbackUrl(next: string): Promise<string> {
  const url = new URL(authRoutes.callback, await siteOrigin());
  url.searchParams.set(nextParam, next);
  return url.toString();
}
