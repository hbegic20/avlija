"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { bs } from "@/lib/i18n/bs";
import { hideListingSchema, type HideListingInput } from "@/lib/validation/admin";

const text = bs.admin.hideDialog;

export function HideDialog({
  open,
  title,
  body,
  defaultReason = "",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  defaultReason?: string;
  onClose: () => void;
  onConfirm: (input: HideListingInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HideListingInput>({ resolver: zodResolver(hideListingSchema), defaultValues: { reason: defaultReason } });

  const close = () => {
    reset({ reason: defaultReason });
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} title={title}>
      <form
        noValidate
        onSubmit={handleSubmit(async (values) => {
          await onConfirm(values);
          reset({ reason: defaultReason });
        })}
        className="flex flex-col gap-5"
      >
        <p className="text-tinta-2">{body}</p>
        <Textarea
          label={text.reason}
          placeholder={text.reasonPlaceholder}
          rows={3}
          maxLength={300}
          error={errors.reason?.message}
          {...register("reason")}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={close} disabled={isSubmitting}>
            {text.cancel}
          </Button>
          <Button type="submit" variant="danger" loading={isSubmitting}>
            {text.confirm}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
