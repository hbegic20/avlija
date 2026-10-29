function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

export const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabasePublishableKey = requireEnv(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export function readSecretKey(): string {
  return requireEnv("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
}
