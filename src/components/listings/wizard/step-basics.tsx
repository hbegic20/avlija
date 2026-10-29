"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Car, House, LandPlot, Store, Tent, Trees } from "lucide-react";
import { saveBasics } from "@/actions/listings";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { propertyTypes, type PropertyType } from "@/lib/domain/enums";
import { listingDescriptionMax } from "@/lib/domain/listing-fields";
import { formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { listingErrorMessage, type ListingErrorCode } from "@/lib/listings/listing-errors";
import { basicsSchema, type BasicsData, type BasicsFormValues } from "@/lib/validation/listing";
import { useReportDirty } from "./use-dirty-state";
import { useWizard } from "./wizard-context";
import { WizardFooter } from "./wizard-footer";

const iconProps = { "aria-hidden": true, size: 18, strokeWidth: 1.5 } as const;

const typeIcons: Record<PropertyType, ReactNode> = {
  stan: <Building2 {...iconProps} />,
  kuca: <House {...iconProps} />,
  plac: <LandPlot {...iconProps} />,
  poljoprivredno: <Trees {...iconProps} />,
  vikendica: <Tent {...iconProps} />,
  poslovni_prostor: <Store {...iconProps} />,
  garaza: <Car {...iconProps} />,
};

const typeOptions: readonly SegmentedOption<PropertyType>[] = propertyTypes.map((type) => ({
  value: type,
  label: bs.enums.propertyType[type],
  icon: typeIcons[type],
}));

const text = bs.listingForm.basics;

export function StepBasics() {
  const { listing, goToStep } = useWizard();
  const [errorCode, setErrorCode] = useState<ListingErrorCode | null>(null);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BasicsFormValues, unknown, BasicsData>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      type: listing?.type ?? "kuca",
      title: listing?.title ?? "",
      priceKm: listing?.price_km ? formatInteger(listing.price_km) : "",
      priceNegotiable: listing?.price_negotiable ?? false,
      description: listing?.description ?? "",
    },
  });
  useReportDirty(isDirty);

  const descriptionLength = useWatch({ control, name: "description" })?.length ?? 0;

  const onSubmit = handleSubmit(async () => {
    setErrorCode(null);
    const result = await saveBasics(listing?.id ?? null, getValues());
    if (result.ok) {
      goToStep(2, result.data.id);
    } else {
      setErrorCode(result.error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      {errorCode ? <FormAlert tone="error">{listingErrorMessage(errorCode)}</FormAlert> : null}
      <div className="overflow-x-auto pb-1">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <SegmentedControl
              name={field.name}
              legend={text.type}
              options={typeOptions}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>
      <Input
        label={text.title}
        placeholder={text.titlePlaceholder}
        maxLength={120}
        error={errors.title?.message}
        {...register("title")}
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <Input
          label={text.price}
          inputMode="numeric"
          unit="KM"
          error={errors.priceKm?.message}
          {...register("priceKm")}
        />
        <Checkbox
          label={text.negotiable}
          helper={text.negotiableHelper}
          className="sm:pt-8"
          {...register("priceNegotiable")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Textarea
          label={text.description}
          placeholder={text.descriptionPlaceholder}
          rows={10}
          maxLength={listingDescriptionMax}
          error={errors.description?.message}
          {...register("description")}
        />
        <p className="self-end font-mono text-label text-tinta-2" aria-live="polite">
          {text.counter(formatInteger(descriptionLength), formatInteger(listingDescriptionMax))}
        </p>
      </div>
      <WizardFooter>
        <span />
        <Button type="submit" size="lg" loading={isSubmitting}>
          {bs.listingForm.next}
        </Button>
      </WizardFooter>
    </form>
  );
}
