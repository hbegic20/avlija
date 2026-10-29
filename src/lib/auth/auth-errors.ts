import type { AuthError } from "@supabase/supabase-js";
import { bs } from "@/lib/i18n/bs";

export const authErrorCodes = [
  "invalid_credentials",
  "email_not_confirmed",
  "too_many_requests",
  "network",
  "weak_password",
  "same_password",
  "session_missing",
  "validation",
  "unexpected",
] as const;
export type AuthErrorCode = (typeof authErrorCodes)[number];

const rateLimitCodes = new Set(["over_request_rate_limit", "over_email_send_rate_limit", "over_sms_send_rate_limit"]);

export function toAuthErrorCode(error: AuthError): AuthErrorCode {
  if (error.code === "invalid_credentials") {
    return "invalid_credentials";
  }
  if (error.code === "email_not_confirmed") {
    return "email_not_confirmed";
  }
  if ((error.code && rateLimitCodes.has(error.code)) || error.status === 429) {
    return "too_many_requests";
  }
  if (error.code === "weak_password") {
    return "weak_password";
  }
  if (error.code === "same_password") {
    return "same_password";
  }
  if (error.code === "session_not_found" || error.name === "AuthSessionMissingError") {
    return "session_missing";
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "network";
  }
  return "unexpected";
}

export function authErrorMessage(code: AuthErrorCode): string {
  const messages: Record<AuthErrorCode, string> = {
    invalid_credentials: bs.auth.errors.invalidCredentials,
    email_not_confirmed: bs.auth.errors.emailNotConfirmed,
    too_many_requests: bs.auth.errors.tooManyRequests,
    network: bs.auth.errors.network,
    weak_password: bs.auth.errors.weakPassword,
    same_password: bs.auth.errors.samePassword,
    session_missing: bs.auth.errors.sessionMissing,
    validation: bs.auth.errors.unexpected,
    unexpected: bs.auth.errors.unexpected,
  };
  return messages[code];
}
