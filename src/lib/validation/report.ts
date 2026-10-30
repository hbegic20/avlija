import { z } from "zod";
import { reportReasons } from "@/lib/domain/enums";
import { bs } from "@/lib/i18n/bs";

export const reportSchema = z.object({
  reason: z.enum(reportReasons, bs.detail.reportReasonRequired),
  details: z.string().trim().max(1000, bs.listingForm.validation.textTooLong(1000)),
});
export type ReportInput = z.infer<typeof reportSchema>;
