import { bs } from "@/lib/i18n/bs";

export type ListingErrorCode =
  | "unauthenticated"
  | "validation"
  | "not_found"
  | "hidden"
  | "point_outside"
  | "phone_required"
  | "listing_limit"
  | "publish_requirements"
  | "image_limit"
  | "unexpected";

const messages = bs.listingForm;

const listingErrorMessages: Record<ListingErrorCode, string> = {
  unauthenticated: bs.auth.errors.sessionMissing,
  validation: bs.auth.errors.unexpected,
  not_found: messages.errors.notFound,
  hidden: messages.errors.hidden,
  point_outside: messages.validation.pointOutside,
  phone_required: messages.errors.phoneRequired,
  listing_limit: messages.errors.listingLimit,
  publish_requirements: messages.errors.publishRequirements,
  image_limit: messages.errors.imageLimit,
  unexpected: bs.auth.errors.unexpected,
};

export function listingErrorMessage(code: ListingErrorCode): string {
  return listingErrorMessages[code];
}
