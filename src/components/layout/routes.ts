import { listingsBasePath } from "@/lib/search/filters";

export const routes = {
  home: "/",
  listings: listingsBasePath,
  municipality: (slug: string) => `${listingsBasePath}/${slug}`,
  terms: "/uslovi-koristenja",
  privacy: "/privatnost",
  contact: "/kontakt",
} as const;
