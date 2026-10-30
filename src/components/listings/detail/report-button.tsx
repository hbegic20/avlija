"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flag } from "lucide-react";
import { reportListing } from "@/actions/listing-interactions";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { reportReasons } from "@/lib/domain/enums";
import { bs } from "@/lib/i18n/bs";
import { interactionErrorMessage, type InteractionErrorCode } from "@/lib/listings/interaction-errors";
import { reportSchema, type ReportInput } from "@/lib/validation/report";

const triggerClasses =
  "inline-flex items-center gap-1.5 text-small text-tinta-2 underline-offset-3 hover:text-greska hover:underline";

export function ReportButton({
  listingId,
  isLoggedIn,
  loginHref,
}: {
  listingId: string;
  isLoggedIn: boolean;
  loginHref: string;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<InteractionErrorCode | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: { details: "" },
  });

  const icon = <Flag aria-hidden="true" size={16} strokeWidth={1.5} />;

  if (!isLoggedIn) {
    return (
      <Link href={loginHref} className={triggerClasses}>
        {icon}
        {bs.detail.report}
      </Link>
    );
  }

  const close = () => {
    setOpen(false);
    setErrorCode(null);
  };

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    const result = await reportListing(listingId, values);
    if (result.ok) {
      reset({ details: "" });
      close();
      showToast(bs.detail.reportSent);
    } else {
      setErrorCode(result.error);
    }
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClasses}>
        {icon}
        {bs.detail.report}
      </button>
      <Dialog open={open} onClose={close} title={bs.detail.reportTitle}>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <p className="text-small text-tinta-2">{bs.detail.reportIntro}</p>
          {errorCode ? <FormAlert tone="error">{interactionErrorMessage(errorCode)}</FormAlert> : null}
          <RadioGroup legend={bs.detail.reportReason} error={errors.reason?.message}>
            {reportReasons.map((reason) => (
              <Radio key={reason} value={reason} label={bs.enums.reportReason[reason]} {...register("reason")} />
            ))}
          </RadioGroup>
          <Textarea
            label={bs.detail.reportDetails}
            placeholder={bs.detail.reportDetailsPlaceholder}
            rows={4}
            maxLength={1000}
            error={errors.details?.message}
            {...register("details")}
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={close}>
              {bs.detail.reportCancel}
            </Button>
            <Button type="submit" variant="danger" loading={isSubmitting}>
              {bs.detail.reportSubmit}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
