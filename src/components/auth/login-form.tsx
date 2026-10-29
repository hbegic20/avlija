"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resendConfirmation, signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authErrorMessage, type AuthErrorCode } from "@/lib/auth/auth-errors";
import { authRoutes, nextParam } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { FormAlert } from "./form-alert";
import { GoogleButton, OrDivider } from "./google-button";

export function LoginForm() {
  const next = useSearchParams().get(nextParam) ?? undefined;
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [resent, setResent] = useState(false);
  const [resending, startResend] = useTransition();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    setResent(false);
    const result = await signIn(values, next);
    if (result && !result.ok) {
      setErrorCode(result.error);
    }
  });

  const resend = () =>
    startResend(async () => {
      const result = await resendConfirmation({ email: getValues("email") });
      if (result.ok) {
        setResent(true);
      } else {
        setErrorCode(result.error);
      }
    });

  return (
    <div className="flex flex-col gap-6">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {errorCode ? (
          <FormAlert
            tone="error"
            action={
              errorCode === "email_not_confirmed" && !resent ? (
                <Button variant="ghost" size="sm" loading={resending} onClick={resend} className="-ml-3">
                  {bs.auth.errors.resendConfirmation}
                </Button>
              ) : null
            }
          >
            {authErrorMessage(errorCode)}
          </FormAlert>
        ) : null}
        {resent ? <FormAlert tone="success">{bs.auth.checkEmail.resent}</FormAlert> : null}
        <Input
          label={bs.auth.fields.email}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label={bs.auth.fields.password}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Link
          href={authRoutes.forgotPassword}
          className="-mt-2 w-fit text-small text-vranica underline underline-offset-3 hover:text-crijep"
        >
          {bs.auth.login.forgotPassword}
        </Link>
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {bs.auth.login.submit}
        </Button>
      </form>
      <OrDivider />
      <GoogleButton next={next} />
    </div>
  );
}
