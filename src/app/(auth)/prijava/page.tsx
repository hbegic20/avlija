import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { FormSkeleton } from "@/components/auth/form-skeleton";
import { LoginForm } from "@/components/auth/login-form";
import { authRoutes } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";

export const metadata: Metadata = {
  title: bs.auth.login.title,
};

export default function LoginPage() {
  return (
    <AuthPanel
      title={bs.auth.login.title}
      description={bs.auth.login.description}
      footer={
        <>
          {bs.auth.login.noAccount}{" "}
          <Link href={authRoutes.register} className="font-medium text-vranica underline underline-offset-3 hover:text-crijep">
            {bs.auth.login.register}
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthPanel>
  );
}
