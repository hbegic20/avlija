"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@/actions/auth";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authErrorMessage, type AuthErrorCode } from "@/lib/auth/auth-errors";
import { authRoutes } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";
import { emailOnlySchema, type EmailOnlyInput } from "@/lib/validation/auth";
import { FormAlert } from "./form-alert";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailOnlyInput>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    const result = await requestPasswordReset(values);
    if (result.ok) {
      setSent(true);
    } else {
      setErrorCode(result.error);
    }
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <FormAlert tone="success">{bs.auth.forgotPassword.sent}</FormAlert>
        <Link href={authRoutes.login} className={buttonStyles({ variant: "secondary", className: "w-fit" })}>
          {bs.auth.forgotPassword.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {errorCode ? <FormAlert tone="error">{authErrorMessage(errorCode)}</FormAlert> : null}
      <Input
        label={bs.auth.fields.email}
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        {bs.auth.forgotPassword.submit}
      </Button>
    </form>
  );
}
