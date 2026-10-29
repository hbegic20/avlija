import type { ListingFeature, PropertyType } from "./enums";

export const detailFields = [
  "areaM2",
  "landAreaM2",
  "rooms",
  "bathrooms",
  "floor",
  "totalFloors",
  "yearBuilt",
  "heating",
  "condition",
  "hasUsagePermit",
] as const;
export type DetailField = (typeof detailFields)[number];

type FieldRule = { visible: readonly DetailField[]; required: readonly DetailField[] };

const buildingFields: readonly DetailField[] = [
  "areaM2",
  "rooms",
  "bathrooms",
  "totalFloors",
  "yearBuilt",
  "heating",
  "condition",
  "hasUsagePermit",
];

export const fieldRules: Record<PropertyType, FieldRule> = {
  stan: { visible: [...buildingFields, "floor"], required: ["areaM2", "floor"] },
  kuca: { visible: [...buildingFields, "landAreaM2"], required: ["areaM2"] },
  vikendica: { visible: [...buildingFields, "landAreaM2"], required: ["areaM2"] },
  poslovni_prostor: { visible: [...buildingFields, "floor"], required: ["areaM2"] },
  garaza: { visible: ["areaM2", "floor", "yearBuilt", "condition", "hasUsagePermit"], required: ["areaM2"] },
  plac: { visible: ["landAreaM2"], required: ["landAreaM2"] },
  poljoprivredno: { visible: ["landAreaM2"], required: ["landAreaM2"] },
};

export function isFieldVisible(type: PropertyType, field: DetailField): boolean {
  return fieldRules[type].visible.includes(field);
}

export function isFieldRequired(type: PropertyType, field: DetailField): boolean {
  return fieldRules[type].required.includes(field);
}

export const isLandType = (type: PropertyType) => type === "plac" || type === "poljoprivredno";

export const featureGroups = {
  space: ["balkon", "terasa", "lift", "podrum", "tavan", "namjesteno"],
  outdoor: ["basta", "bazen", "parking", "garaza"],
  installations: ["klima", "internet", "alarm"],
  land: ["pristup_asfaltu", "struja_na_placu", "voda_na_placu", "kanalizacija"],
} as const satisfies Record<string, readonly ListingFeature[]>;
export type FeatureGroup = keyof typeof featureGroups;

export function featureGroupsFor(type: PropertyType): readonly FeatureGroup[] {
  if (isLandType(type)) {
    return ["land"];
  }
  if (type === "garaza") {
    return ["installations"];
  }
  if (type === "stan" || type === "poslovni_prostor") {
    return ["space", "outdoor", "installations"];
  }
  return ["space", "outdoor", "installations", "land"];
}

export function allowedFeaturesFor(type: PropertyType): readonly ListingFeature[] {
  return featureGroupsFor(type).flatMap((group) => featureGroups[group]);
}

export const maxListingImages = 20;
export const listingDescriptionMax = 5000;
export const listingTitleMin = 10;
export const listingTitleMax = 120;
