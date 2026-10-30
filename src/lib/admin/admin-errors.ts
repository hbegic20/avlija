import { bs } from "@/lib/i18n/bs";

export type AdminErrorCode = "forbidden" | "validation" | "not_found" | "unhide_requirements" | "unexpected";

const messages: Record<AdminErrorCode, string> = {
  forbidden: bs.admin.errors.forbidden,
  validation: bs.auth.errors.unexpected,
  not_found: bs.listingForm.errors.notFound,
  unhide_requirements: bs.admin.errors.unhideRequirements,
  unexpected: bs.auth.errors.unexpected,
};

export function adminErrorMessage(code: AdminErrorCode): string {
  return messages[code];
}
