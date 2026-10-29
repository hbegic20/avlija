export const routes = {
  home: "/",
  listings: "/nekretnine",
  municipality: (slug: string) => `/nekretnine/${slug}`,
  login: "/prijava",
  newListing: "/moj-racun/oglasi/novi",
  terms: "/uslovi-koristenja",
  privacy: "/privatnost",
  contact: "/kontakt",
} as const;
