export type MunicipalityLink = {
  slug: string;
  name: string;
};

export const sbkMunicipalities: readonly MunicipalityLink[] = [
  { slug: "bugojno", name: "Bugojno" },
  { slug: "busovaca", name: "Busovača" },
  { slug: "dobretici", name: "Dobretići" },
  { slug: "donji-vakuf", name: "Donji Vakuf" },
  { slug: "fojnica", name: "Fojnica" },
  { slug: "gornji-vakuf-uskoplje", name: "Gornji Vakuf-Uskoplje" },
  { slug: "jajce", name: "Jajce" },
  { slug: "kiseljak", name: "Kiseljak" },
  { slug: "kresevo", name: "Kreševo" },
  { slug: "novi-travnik", name: "Novi Travnik" },
  { slug: "travnik", name: "Travnik" },
  { slug: "vitez", name: "Vitez" },
];

export const defaultMapCentre = {
  name: "Bugojno",
  lat: 44.0559,
  lng: 17.4509,
};
