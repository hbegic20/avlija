import { bs } from "@/lib/i18n/bs";

export type ListingTextErrorCode =
  | "unauthenticated"
  | "validation"
  | "not_found"
  | "not_enough_input"
  | "rate_limited"
  | "busy"
  | "unavailable";

const messages = bs.listingForm.basics.suggestion.errors;

const listingTextErrorMessages: Record<ListingTextErrorCode, string> = {
  unauthenticated: bs.auth.errors.sessionMissing,
  validation: bs.auth.errors.unexpected,
  not_found: bs.listingForm.errors.notFound,
  not_enough_input: messages.notEnoughInput,
  rate_limited: messages.rateLimited,
  busy: messages.busy,
  unavailable: messages.unavailable,
};

export function listingTextErrorMessage(code: ListingTextErrorCode): string {
  return listingTextErrorMessages[code];
}
