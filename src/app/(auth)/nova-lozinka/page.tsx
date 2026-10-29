import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { FormAlert } from "@/components/auth/form-alert";
import { FormSkeleton } from "@/components/auth/form-skeleton";
import { NewPasswordForm } from "@/components/auth/new-password-form";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { authRoutes } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";

export const metadata: Metadata = {
  title: bs.auth.newPassword.title,
  robots: { index: false, follow: false },
};

async function NewPasswordGate() {
  const user = await getCurrentUser();
  if (user) {
    return <NewPasswordForm />;
  }
  return (
    <div className="flex flex-col gap-5">
      <FormAlert tone="error">{bs.auth.newPassword.linkExpired}</FormAlert>
      <Link href={authRoutes.forgotPassword} className={buttonStyles({ variant: "secondary", className: "w-fit" })}>
        {bs.auth.newPassword.requestNew}
      </Link>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <AuthPanel title={bs.auth.newPassword.title} description={bs.auth.newPassword.description}>
      <Suspense fallback={<FormSkeleton />}>
        <NewPasswordGate />
      </Suspense>
    </AuthPanel>
  );
}
