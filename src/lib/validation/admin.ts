import { z } from "zod";
import { bs } from "@/lib/i18n/bs";

const hideReasonSchema = z
  .string()
  .trim()
  .min(3, bs.admin.hideDialog.reasonRequired)
  .max(300, bs.admin.hideDialog.reasonRequired);

export const hideListingSchema = z.object({ reason: hideReasonSchema });
export type HideListingInput = z.infer<typeof hideListingSchema>;

export const reportResolutionSchema = z.enum(["resolved", "dismissed"]);
export type ReportResolution = z.infer<typeof reportResolutionSchema>;
