import { authRoutes } from "./routes";

export function safeNextPath(value: string | null | undefined, fallback: string = authRoutes.dashboard): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
