import { z } from "zod";
import { bs } from "@/lib/i18n/bs";

const messages = bs.auth.validation;

const email = z.string().trim().toLowerCase().pipe(z.email(messages.emailInvalid));

const newPassword = z
  .string()
  .min(8, messages.passwordLength)
  .regex(/[A-Za-z]/, messages.passwordLetter)
  .regex(/[0-9]/, messages.passwordNumber);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, messages.passwordRequired),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, messages.fullNameLength).max(80, messages.fullNameLength),
    email,
    password: newPassword,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((accepted) => accepted, messages.termsRequired),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: messages.passwordsMismatch,
    path: ["confirmPassword"],
  });
export type SignUpInput = z.infer<typeof signUpSchema>;

export const emailOnlySchema = z.object({ email });
export type EmailOnlyInput = z.infer<typeof emailOnlySchema>;

export const newPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: messages.passwordsMismatch,
    path: ["confirmPassword"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
