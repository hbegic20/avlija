"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateContacts } from "@/actions/profile";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { bs } from "@/lib/i18n/bs";
import { profileErrorMessage, type ProfileErrorCode } from "@/lib/profile/profile-errors";
import { contactSchema, type ContactInput } from "@/lib/validation/profile";

export function ContactForm({ defaultValues }: { defaultValues: ContactInput }) {
  const { showToast } = useToast();
  const [errorCode, setErrorCode] = useState<ProfileErrorCode | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema), defaultValues });

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    const result = await updateContacts(values);
    if (result.ok) {
      reset(values);
      showToast(bs.profile.saved);
    } else {
      setErrorCode(result.error);
    }
  });

  return (
    <form id="kontakt" noValidate onSubmit={onSubmit} className="flex scroll-mt-8 flex-col gap-5">
      {errorCode ? <FormAlert tone="error">{profileErrorMessage(errorCode)}</FormAlert> : null}
      <Input
        label={bs.profile.contact.phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={bs.profile.contact.phonePlaceholder}
        helper={bs.profile.contact.phoneHelper}
        error={errors.phone?.message}
        className="font-mono"
        {...register("phone")}
      />
      <div className="flex flex-col gap-3">
        <Checkbox label={bs.profile.contact.viber} {...register("hasViber")} />
        <Checkbox label={bs.profile.contact.whatsapp} {...register("hasWhatsapp")} />
      </div>
      <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="w-fit">
        {bs.profile.save}
      </Button>
    </form>
  );
}
