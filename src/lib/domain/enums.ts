export const propertyTypes = [
  "stan",
  "kuca",
  "plac",
  "poljoprivredno",
  "vikendica",
  "poslovni_prostor",
  "garaza",
] as const;
export type PropertyType = (typeof propertyTypes)[number];

export const listingStatuses = ["draft", "active", "sold", "archived", "hidden"] as const;
export type ListingStatus = (typeof listingStatuses)[number];

export const heatingTypes = [
  "centralno",
  "etazno",
  "struja",
  "drva",
  "plin",
  "toplotna_pumpa",
  "nema",
] as const;
export type HeatingType = (typeof heatingTypes)[number];

export const propertyConditions = [
  "novogradnja",
  "renovirano",
  "useljivo",
  "potrebna_adaptacija",
  "roh_bau",
] as const;
export type PropertyCondition = (typeof propertyConditions)[number];

export const reportReasons = [
  "lazni_oglas",
  "prodano",
  "netacni_podaci",
  "neprimjereno",
  "prevara",
  "ostalo",
] as const;
export type ReportReason = (typeof reportReasons)[number];

export const reportStatuses = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export const userRoles = ["user", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const listingFeatures = [
  "balkon",
  "terasa",
  "lift",
  "parking",
  "garaza",
  "podrum",
  "tavan",
  "basta",
  "bazen",
  "klima",
  "namjesteno",
  "internet",
  "alarm",
  "pristup_asfaltu",
  "struja_na_placu",
  "voda_na_placu",
  "kanalizacija",
] as const;
export type ListingFeature = (typeof listingFeatures)[number];

export const stampVariants = ["uknjizeno", "prodano", "novo", "istice"] as const;
export type StampVariant = (typeof stampVariants)[number];
