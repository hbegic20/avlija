import { authErrorMessage, authErrorCodes, type AuthErrorCode } from "@/lib/auth/auth-errors";
import { bs } from "@/lib/i18n/bs";

export type ProfileErrorCode =
  | AuthErrorCode
  | "unauthenticated"
  | "phone_needed_for_active"
  | "wrong_current_password"
  | "same_email"
  | "email_taken";

const profileOnlyMessages: Record<Exclude<ProfileErrorCode, AuthErrorCode>, string> = {
  unauthenticated: bs.auth.errors.sessionMissing,
  phone_needed_for_active: bs.profile.contact.phoneNeededForActive,
  wrong_current_password: bs.profile.security.wrongCurrentPassword,
  same_email: bs.profile.security.sameEmail,
  email_taken: bs.profile.security.emailTaken,
};

function isAuthErrorCode(code: ProfileErrorCode): code is AuthErrorCode {
  return (authErrorCodes as readonly string[]).includes(code);
}

export function profileErrorMessage(code: ProfileErrorCode): string {
  return isAuthErrorCode(code) ? authErrorMessage(code) : profileOnlyMessages[code];
}
