import { z } from "zod";
import { bs } from "@/lib/i18n/bs";

const authMessages = bs.auth.validation;
const profileMessages = bs.profile;

export const phonePattern = /^\+?[0-9 ]{6,20}$/;

export const basicInfoSchema = z.object({
  fullName: z.string().trim().min(2, authMessages.fullNameLength).max(80, authMessages.fullNameLength),
  municipalityId: z.string().regex(/^([0-9]{1,2})?$/),
});
export type BasicInfoInput = z.infer<typeof basicInfoSchema>;

export const contactSchema = z.object({
  phone: z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .refine((value) => value === "" || phonePattern.test(value), profileMessages.contact.phoneInvalid),
  hasViber: z.boolean(),
  hasWhatsapp: z.boolean(),
});
export type ContactInput = z.input<typeof contactSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, authMessages.passwordRequired),
    password: z
      .string()
      .min(8, authMessages.passwordLength)
      .regex(/[A-Za-z]/, authMessages.passwordLetter)
      .regex(/[0-9]/, authMessages.passwordNumber),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: authMessages.passwordsMismatch,
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email(authMessages.emailInvalid)),
});
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

export const deleteAccountSchema = z.object({
  confirmation: z.literal(profileMessages.danger.confirmWord),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const avatarPathFor = (userId: string) => `${userId}/avatar.webp`;
