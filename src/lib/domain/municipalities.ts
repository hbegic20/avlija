export type MunicipalityLink = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
};

export const sbkMunicipalities: readonly MunicipalityLink[] = [
  { slug: "bugojno", name: "Bugojno", lat: 44.0559, lng: 17.4509 },
  { slug: "busovaca", name: "Busovača", lat: 44.0985, lng: 17.8791 },
  { slug: "dobretici", name: "Dobretići", lat: 44.3753, lng: 17.4166 },
  { slug: "donji-vakuf", name: "Donji Vakuf", lat: 44.1445, lng: 17.395 },
  { slug: "fojnica", name: "Fojnica", lat: 43.9634, lng: 17.899 },
  { slug: "gornji-vakuf-uskoplje", name: "Gornji Vakuf-Uskoplje", lat: 43.9386, lng: 17.5853 },
  { slug: "jajce", name: "Jajce", lat: 44.3397, lng: 17.2712 },
  { slug: "kiseljak", name: "Kiseljak", lat: 43.9432, lng: 18.0775 },
  { slug: "kresevo", name: "Kreševo", lat: 43.8657, lng: 18.0422 },
  { slug: "novi-travnik", name: "Novi Travnik", lat: 44.1708, lng: 17.6577 },
  { slug: "travnik", name: "Travnik", lat: 44.2259, lng: 17.6662 },
  { slug: "vitez", name: "Vitez", lat: 44.1508, lng: 17.7915 },
];

export const defaultMunicipality: MunicipalityLink = sbkMunicipalities[0];
