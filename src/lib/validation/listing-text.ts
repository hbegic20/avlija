import { z } from "zod";
import { propertyTypes } from "@/lib/domain/enums";
import { listingDescriptionMax, listingTitleMax, listingTitleMin } from "@/lib/domain/listing-fields";
import { idSchema } from "./id";

export const listingNotesMin = 20;

export const listingTextRequestSchema = z.object({
  listingId: idSchema.nullable(),
  type: z.enum(propertyTypes),
  title: z.string().trim().max(listingTitleMax),
  notes: z.string().trim().max(listingDescriptionMax),
});
export type ListingTextRequest = z.input<typeof listingTextRequestSchema>;

export const listingTextSuggestionSchema = z.object({
  title: z.string().trim().min(listingTitleMin).max(listingTitleMax),
  description: z.string().trim().min(150).max(listingDescriptionMax),
});
export type ListingTextSuggestion = z.output<typeof listingTextSuggestionSchema>;
