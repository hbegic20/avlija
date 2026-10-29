"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changeEmail } from "@/actions/profile";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { DataRow } from "@/components/ui/data-row";
import { Input } from "@/components/ui/input";
import { Ledger } from "@/components/ui/ledger";
import { bs } from "@/lib/i18n/bs";
import { profileErrorMessage, type ProfileErrorCode } from "@/lib/profile/profile-errors";
import { changeEmailSchema, type ChangeEmailInput } from "@/lib/validation/profile";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [errorCode, setErrorCode] = useState<ProfileErrorCode | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailInput>({ resolver: zodResolver(changeEmailSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    setSent(false);
    const result = await changeEmail(values);
    if (result.ok) {
      setSent(true);
    } else {
      setErrorCode(result.error);
    }
  });

  return (
    <div className="flex flex-col gap-5">
      <Ledger>
        <DataRow label={bs.profile.security.currentEmail} value={currentEmail} />
      </Ledger>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {errorCode ? <FormAlert tone="error">{profileErrorMessage(errorCode)}</FormAlert> : null}
        {sent ? <FormAlert tone="success">{bs.profile.security.emailChangeSent}</FormAlert> : null}
        <Input
          label={bs.profile.security.newEmail}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" variant="secondary" loading={isSubmitting} className="w-fit">
          {bs.profile.security.sendConfirmation}
        </Button>
      </form>
    </div>
  );
}
