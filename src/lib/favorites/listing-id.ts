import { idSchema } from "@/lib/validation/id";

export function isListingId(value: string | null): value is string {
  return value !== null && idSchema.safeParse(value).success;
}
