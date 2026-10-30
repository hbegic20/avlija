import { slugify } from "@/lib/text/searchable";

export function listingPath(listingNumber: number, title: string): string {
  const slug = slugify(title);
  return slug ? `/oglas/${listingNumber}-${slug}` : `/oglas/${listingNumber}`;
}
