export const routes = {
  home: "/",
  listings: "/nekretnine",
  municipality: (slug: string) => `/nekretnine/${slug}`,
  login: "/prijava",
  register: "/registracija",
  newListing: "/moj-racun/oglasi/novi",
  terms: "/uslovi-koristenja",
  privacy: "/privatnost",
  contact: "/kontakt",
} as const;
