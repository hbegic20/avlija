import { bs } from "@/lib/i18n/bs";

export type AdminErrorCode =
  | "forbidden"
  | "validation"
  | "not_found"
  | "unhide_requirements"
  | "self_demotion"
  | "listed_admin"
  | "self_deletion"
  | "target_is_admin"
  | "unexpected";

const messages: Record<AdminErrorCode, string> = {
  forbidden: bs.admin.errors.forbidden,
  validation: bs.auth.errors.unexpected,
  not_found: bs.listingForm.errors.notFound,
  unhide_requirements: bs.admin.errors.unhideRequirements,
  self_demotion: bs.admin.errors.selfDemotion,
  listed_admin: bs.admin.errors.listedAdmin,
  self_deletion: bs.admin.errors.selfDeletion,
  target_is_admin: bs.admin.errors.targetIsAdmin,
  unexpected: bs.auth.errors.unexpected,
};

export function adminErrorMessage(code: AdminErrorCode): string {
  return messages[code];
}
