export const favoritesRoutes = {
  page: "/moj-racun/sacuvano",
  add: "/moj-racun/sacuvano/dodaj",
} as const;

export const addFavoriteParams = { listing: "oglas", back: "nazad" } as const;

export function addFavoriteHref(listingId: string, backPath: string): string {
  const params = new URLSearchParams({ [addFavoriteParams.listing]: listingId, [addFavoriteParams.back]: backPath });
  return `${favoritesRoutes.add}?${params.toString()}`;
}
