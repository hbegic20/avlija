"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { routes } from "@/components/layout/routes";
import { authErrorMessage, type AuthErrorCode } from "@/lib/auth/auth-errors";
import { bs } from "@/lib/i18n/bs";
import { signUpSchema, type SignUpInput } from "@/lib/validation/auth";
import { CheckEmail } from "./check-email";
import { FormAlert } from "./form-alert";
import { GoogleButton, OrDivider } from "./google-button";

const inlineLinkClasses = "text-vranica underline underline-offset-3 hover:text-crijep";

export function RegisterForm() {
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    const result = await signUp(values);
    if (result.ok) {
      setSentTo(result.data.email);
    } else {
      setErrorCode(result.error);
    }
  });

  if (sentTo) {
    return <CheckEmail email={sentTo} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {errorCode ? <FormAlert tone="error">{authErrorMessage(errorCode)}</FormAlert> : null}
        <Input
          label={bs.auth.fields.fullName}
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
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
          autoComplete="new-password"
          helper={bs.auth.passwordHelper}
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label={bs.auth.fields.confirmPassword}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Checkbox
          label={
            <>
              {bs.auth.termsPrefix}
              <Link href={routes.terms} target="_blank" className={inlineLinkClasses}>
                {bs.auth.termsLink}
              </Link>
              {bs.auth.termsJoin}
              <Link href={routes.privacy} target="_blank" className={inlineLinkClasses}>
                {bs.auth.privacyLink}
              </Link>
            </>
          }
          error={errors.acceptTerms?.message}
          {...register("acceptTerms")}
        />
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {bs.auth.register.submit}
        </Button>
      </form>
      <OrDivider />
      <GoogleButton />
    </div>
  );
}
