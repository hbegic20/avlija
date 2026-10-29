import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { RegisterForm } from "@/components/auth/register-form";
import { authRoutes } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";

export const metadata: Metadata = {
  title: bs.auth.register.title,
};

export default function RegisterPage() {
  return (
    <AuthPanel
      title={bs.auth.register.title}
      description={bs.auth.register.description}
      footer={
        <>
          {bs.auth.register.hasAccount}{" "}
          <Link href={authRoutes.login} className="font-medium text-vranica underline underline-offset-3 hover:text-crijep">
            {bs.auth.register.login}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthPanel>
  );
}
