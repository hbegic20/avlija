import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/auth-panel";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { bs } from "@/lib/i18n/bs";

export const metadata: Metadata = {
  title: bs.auth.forgotPassword.title,
};

export default function ForgotPasswordPage() {
  return (
    <AuthPanel title={bs.auth.forgotPassword.title} description={bs.auth.forgotPassword.description}>
      <ForgotPasswordForm />
    </AuthPanel>
  );
}
