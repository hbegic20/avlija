"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBasicInfo } from "@/actions/profile";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { bs } from "@/lib/i18n/bs";
import { profileErrorMessage, type ProfileErrorCode } from "@/lib/profile/profile-errors";
import { basicInfoSchema, type BasicInfoInput } from "@/lib/validation/profile";

export function BasicInfoForm({
  defaultValues,
  municipalityOptions,
}: {
  defaultValues: BasicInfoInput;
  municipalityOptions: readonly SelectOption[];
}) {
  const { showToast } = useToast();
  const [errorCode, setErrorCode] = useState<ProfileErrorCode | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BasicInfoInput>({ resolver: zodResolver(basicInfoSchema), defaultValues });

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    const result = await updateBasicInfo(values);
    if (result.ok) {
      reset(values);
      showToast(bs.profile.saved);
    } else {
      setErrorCode(result.error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {errorCode ? <FormAlert tone="error">{profileErrorMessage(errorCode)}</FormAlert> : null}
      <Input
        label={bs.auth.fields.fullName}
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Select
        label={bs.profile.basic.municipality}
        placeholder={bs.profile.basic.municipalityPlaceholder}
        options={municipalityOptions}
        {...register("municipalityId")}
      />
      <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="w-fit">
        {bs.profile.save}
      </Button>
    </form>
  );
}
