import { bs } from "@/lib/i18n/bs";

export type InteractionErrorCode =
  | "unauthenticated"
  | "validation"
  | "not_found"
  | "duplicate"
  | "report_rate_limited"
  | "reveal_rate_limited"
  | "unexpected";

const messages: Record<InteractionErrorCode, string> = {
  unauthenticated: bs.auth.errors.sessionMissing,
  validation: bs.auth.errors.unexpected,
  not_found: bs.listingForm.errors.notFound,
  duplicate: bs.detail.reportDuplicate,
  report_rate_limited: bs.detail.reportRateLimited,
  reveal_rate_limited: bs.detail.revealRateLimited,
  unexpected: bs.auth.errors.unexpected,
};

export function interactionErrorMessage(code: InteractionErrorCode): string {
  return messages[code];
}
