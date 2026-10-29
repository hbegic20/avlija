import { z } from "zod";
import {
  heatingTypes,
  listingFeatures,
  propertyConditions,
  propertyTypes,
  type PropertyType,
} from "@/lib/domain/enums";
import {
  allowedFeaturesFor,
  isFieldRequired,
  isFieldVisible,
  listingDescriptionMax,
  listingTitleMax,
  listingTitleMin,
  type DetailField,
} from "@/lib/domain/listing-fields";
import { bs } from "@/lib/i18n/bs";

const messages = bs.listingForm.validation;

export function parseLocaleNumber(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (normalized === "") {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export const triStateValues = ["", "da", "ne"] as const;
export type TriState = (typeof triStateValues)[number];

export function triStateToBoolean(value: TriState): boolean | null {
  return value === "" ? null : value === "da";
}

export function booleanToTriState(value: boolean | null): TriState {
  return value === null ? "" : value ? "da" : "ne";
}

export const basicsSchema = z
  .object({
    type: z.enum(propertyTypes, messages.typeRequired),
    title: z.string().trim().min(listingTitleMin, messages.titleLength).max(listingTitleMax, messages.titleLength),
    priceKm: z.string(),
    priceNegotiable: z.boolean(),
    description: z.string().trim().max(listingDescriptionMax, messages.descriptionLength),
  })
  .superRefine((values, context) => {
    const price = parseLocaleNumber(values.priceKm);
    if (price === null) {
      if (!values.priceNegotiable) {
        context.addIssue({ code: "custom", message: messages.priceRequired, path: ["priceKm"] });
      }
      return;
    }
    if (!Number.isInteger(price) || price <= 0 || price > 2_000_000_000) {
      context.addIssue({ code: "custom", message: messages.priceInvalid, path: ["priceKm"] });
    }
  })
  .transform((values) => ({ ...values, priceKm: parseLocaleNumber(values.priceKm) }));
export type BasicsFormValues = z.input<typeof basicsSchema>;
export type BasicsData = z.output<typeof basicsSchema>;

export const locationSchema = z.object({
  municipalityId: z.string().regex(/^[0-9]{1,2}$/, messages.municipalityRequired),
  neighborhood: z.string().trim().max(80, messages.textTooLong(80)),
  address: z.string().trim().max(160, messages.textTooLong(160)),
  locationPrecise: z.boolean(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
});
export type LocationFormValues = z.input<typeof locationSchema>;

export const locationStepSchema = locationSchema.refine((values) => values.lat !== null && values.lng !== null, {
  error: messages.pointRequired,
  path: ["lat"],
});

const detailInputShape = {
  areaM2: z.string(),
  landAreaM2: z.string(),
  rooms: z.string(),
  bathrooms: z.string(),
  floor: z.string(),
  totalFloors: z.string(),
  yearBuilt: z.string(),
  heating: z.union([z.literal(""), z.enum(heatingTypes)]),
  condition: z.union([z.literal(""), z.enum(propertyConditions)]),
  isRegistered: z.enum(triStateValues),
  hasBuildingPermit: z.enum(triStateValues),
  hasUsagePermit: z.enum(triStateValues),
  features: z.array(z.enum(listingFeatures)),
};

export const detailsFormSchema = z.object(detailInputShape);
export type DetailsFormValues = z.input<typeof detailsFormSchema>;

type NumericRule = { field: DetailField & keyof DetailsFormValues; integer: boolean; min: number; max: number };

const numericRules: readonly NumericRule[] = [
  { field: "areaM2", integer: false, min: 0.01, max: 999_999 },
  { field: "landAreaM2", integer: false, min: 0.01, max: 99_999_999 },
  { field: "rooms", integer: false, min: 0, max: 99 },
  { field: "bathrooms", integer: true, min: 0, max: 50 },
  { field: "floor", integer: true, min: -5, max: 100 },
  { field: "totalFloors", integer: true, min: 0, max: 100 },
  { field: "yearBuilt", integer: true, min: 1800, max: 2100 },
];

export type DetailsData = {
  areaM2: number | null;
  landAreaM2: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  heating: (typeof heatingTypes)[number] | null;
  condition: (typeof propertyConditions)[number] | null;
  isRegistered: boolean | null;
  hasBuildingPermit: boolean | null;
  hasUsagePermit: boolean | null;
  features: (typeof listingFeatures)[number][];
};

export function detailsSchemaFor(type: PropertyType) {
  return detailsFormSchema
    .superRefine((values, context) => {
      for (const rule of numericRules) {
        if (!isFieldVisible(type, rule.field)) {
          continue;
        }
        const parsed = parseLocaleNumber(values[rule.field]);
        if (parsed === null) {
          if (isFieldRequired(type, rule.field)) {
            context.addIssue({ code: "custom", message: messages.required, path: [rule.field] });
          }
          continue;
        }
        const outOfRange = Number.isNaN(parsed) || parsed < rule.min || parsed > rule.max;
        if (outOfRange || (rule.integer && !Number.isInteger(parsed))) {
          const message = rule.field === "yearBuilt" ? messages.yearInvalid : messages.numberInvalid;
          context.addIssue({ code: "custom", message, path: [rule.field] });
        }
      }
      const floor = parseLocaleNumber(values.floor);
      const totalFloors = parseLocaleNumber(values.totalFloors);
      if (
        isFieldVisible(type, "floor") &&
        floor !== null &&
        totalFloors !== null &&
        !Number.isNaN(floor) &&
        !Number.isNaN(totalFloors) &&
        floor > totalFloors
      ) {
        context.addIssue({ code: "custom", message: messages.floorAboveTotal, path: ["floor"] });
      }
    })
    .transform((values): DetailsData => {
      const numberOf = (field: NumericRule["field"]) =>
        isFieldVisible(type, field) ? parseLocaleNumber(values[field]) : null;
      const allowedFeatures = allowedFeaturesFor(type);
      return {
        areaM2: numberOf("areaM2"),
        landAreaM2: numberOf("landAreaM2"),
        rooms: numberOf("rooms"),
        bathrooms: numberOf("bathrooms"),
        floor: numberOf("floor"),
        totalFloors: numberOf("totalFloors"),
        yearBuilt: numberOf("yearBuilt"),
        heating: isFieldVisible(type, "heating") && values.heating !== "" ? values.heating : null,
        condition: isFieldVisible(type, "condition") && values.condition !== "" ? values.condition : null,
        isRegistered: triStateToBoolean(values.isRegistered),
        hasBuildingPermit: triStateToBoolean(values.hasBuildingPermit),
        hasUsagePermit: isFieldVisible(type, "hasUsagePermit") ? triStateToBoolean(values.hasUsagePermit) : null,
        features: values.features.filter((feature) => allowedFeatures.includes(feature)),
      };
    });
}

const positiveNumber = z.number().positive();

const publishBase = z.object({
  title: z.string().min(listingTitleMin).max(listingTitleMax),
  municipalityId: z.number().int().positive(),
  lat: z.number(),
  lng: z.number(),
  priceKm: z.number().int().positive().nullable(),
  priceNegotiable: z.boolean(),
  imageCount: z.number().int().min(1, messages.photosRequired),
  areaM2: z.number().nullable(),
  landAreaM2: z.number().nullable(),
  floor: z.number().nullable(),
});

const withPrice = <Schema extends z.ZodType<{ priceKm: number | null; priceNegotiable: boolean }>>(schema: Schema) =>
  schema.refine((listing) => listing.priceKm !== null || listing.priceNegotiable, {
    error: messages.priceRequired,
    path: ["priceKm"],
  });

export const publishListingSchema = withPrice(
  z.discriminatedUnion("type", [
    publishBase.extend({ type: z.literal("stan"), areaM2: positiveNumber, floor: z.number().int() }),
    publishBase.extend({ type: z.literal("kuca"), areaM2: positiveNumber }),
    publishBase.extend({ type: z.literal("vikendica"), areaM2: positiveNumber }),
    publishBase.extend({ type: z.literal("poslovni_prostor"), areaM2: positiveNumber }),
    publishBase.extend({ type: z.literal("garaza"), areaM2: positiveNumber }),
    publishBase.extend({ type: z.literal("plac"), landAreaM2: positiveNumber }),
    publishBase.extend({ type: z.literal("poljoprivredno"), landAreaM2: positiveNumber }),
  ]),
);
export type PublishListingInput = z.input<typeof publishListingSchema>;

export const listingIdSchema = z.uuid();

export const imageRegistrationSchema = z.object({
  storagePath: z.string().min(1).max(300),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
});
export type ImageRegistration = z.infer<typeof imageRegistrationSchema>;

export const imageOrderSchema = z.array(z.uuid()).max(20);
