"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authErrorMessage, type AuthErrorCode } from "@/lib/auth/auth-errors";
import { bs } from "@/lib/i18n/bs";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/validation/auth";
import { FormAlert } from "./form-alert";

export function NewPasswordForm() {
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    const result = await updatePassword(values);
    if (result && !result.ok) {
      setErrorCode(result.error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {errorCode ? <FormAlert tone="error">{authErrorMessage(errorCode)}</FormAlert> : null}
      <Input
        label={bs.auth.fields.newPassword}
        type="password"
        autoComplete="new-password"
        helper={bs.auth.passwordHelper}
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label={bs.auth.fields.confirmNewPassword}
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        {bs.auth.newPassword.submit}
      </Button>
    </form>
  );
}
