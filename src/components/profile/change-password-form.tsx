"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/actions/profile";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { bs } from "@/lib/i18n/bs";
import { profileErrorMessage, type ProfileErrorCode } from "@/lib/profile/profile-errors";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/profile";

const emptyValues: ChangePasswordInput = { currentPassword: "", password: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const { showToast } = useToast();
  const [errorCode, setErrorCode] = useState<ProfileErrorCode | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: emptyValues });

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    const result = await changePassword(values);
    if (result.ok) {
      reset(emptyValues);
      showToast(bs.profile.security.passwordChanged);
    } else {
      setErrorCode(result.error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {errorCode ? <FormAlert tone="error">{profileErrorMessage(errorCode)}</FormAlert> : null}
      <Input
        label={bs.profile.security.currentPassword}
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
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
      <Button type="submit" variant="secondary" loading={isSubmitting} className="w-fit">
        {bs.profile.save}
      </Button>
    </form>
  );
}
