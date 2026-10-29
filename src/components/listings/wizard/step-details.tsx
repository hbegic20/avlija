"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveDetails } from "@/actions/listings";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { heatingTypes, propertyConditions } from "@/lib/domain/enums";
import {
  featureGroups,
  featureGroupsFor,
  isFieldRequired,
  isFieldVisible,
  isLandType,
  type DetailField,
} from "@/lib/domain/listing-fields";
import { formatDecimal } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { listingErrorMessage, type ListingErrorCode } from "@/lib/listings/listing-errors";
import {
  booleanToTriState,
  detailsSchemaFor,
  type DetailsData,
  type DetailsFormValues,
  type TriState,
} from "@/lib/validation/listing";
import { useReportDirty } from "./use-dirty-state";
import { useWizard } from "./wizard-context";
import { WizardFooter } from "./wizard-footer";

const text = bs.listingForm.details;

const triStateOptions: readonly SegmentedOption<TriState>[] = [
  { value: "da", label: text.yes },
  { value: "ne", label: text.no },
  { value: "", label: text.unknown },
];

const toText = (value: number | null) => (value === null ? "" : formatDecimal(value).replace(/\./g, ""));

function requiredMark(label: string, required: boolean): string {
  return required ? `${label} *` : label;
}

export function StepDetails() {
  const { listing, goToStep } = useWizard();
  const [errorCode, setErrorCode] = useState<ListingErrorCode | null>(null);
  const type = listing?.type ?? "kuca";
  const schema = useMemo(() => detailsSchemaFor(type), [type]);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DetailsFormValues, unknown, DetailsData>({
    resolver: zodResolver(schema),
    defaultValues: {
      areaM2: toText(listing?.area_m2 ?? null),
      landAreaM2: toText(listing?.land_area_m2 ?? null),
      rooms: toText(listing?.rooms ?? null),
      bathrooms: toText(listing?.bathrooms ?? null),
      floor: toText(listing?.floor ?? null),
      totalFloors: toText(listing?.total_floors ?? null),
      yearBuilt: listing?.year_built ? String(listing.year_built) : "",
      heating: listing?.heating ?? "",
      condition: listing?.condition ?? "",
      isRegistered: booleanToTriState(listing?.is_registered ?? null),
      hasBuildingPermit: booleanToTriState(listing?.has_building_permit ?? null),
      hasUsagePermit: booleanToTriState(listing?.has_usage_permit ?? null),
      features: (listing?.features ?? []) as DetailsFormValues["features"],
    },
  });
  useReportDirty(isDirty);

  const visible = (field: DetailField) => isFieldVisible(type, field);
  const label = (field: DetailField, base: string) => requiredMark(base, isFieldRequired(type, field));

  const onSubmit = handleSubmit(async () => {
    setErrorCode(null);
    if (!listing) {
      return;
    }
    const result = await saveDetails(listing.id, getValues());
    if (result.ok) {
      goToStep(4);
    } else {
      setErrorCode(result.error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
      {errorCode ? <FormAlert tone="error">{listingErrorMessage(errorCode)}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {visible("areaM2") ? (
          <Input
            label={label("areaM2", text.areaM2)}
            inputMode="decimal"
            unit="m²"
            error={errors.areaM2?.message}
            {...register("areaM2")}
          />
        ) : null}
        {visible("landAreaM2") ? (
          <Input
            label={label("landAreaM2", isLandType(type) ? text.landAreaM2Land : text.landAreaM2)}
            inputMode="decimal"
            unit="m²"
            error={errors.landAreaM2?.message}
            {...register("landAreaM2")}
          />
        ) : null}
        {visible("rooms") ? (
          <Input
            label={label("rooms", text.rooms)}
            inputMode="decimal"
            helper={text.roomsHelper}
            error={errors.rooms?.message}
            {...register("rooms")}
          />
        ) : null}
        {visible("bathrooms") ? (
          <Input
            label={label("bathrooms", text.bathrooms)}
            inputMode="numeric"
            error={errors.bathrooms?.message}
            {...register("bathrooms")}
          />
        ) : null}
        {visible("floor") ? (
          <Input
            label={label("floor", text.floor)}
            inputMode="numeric"
            helper={text.floorHelper}
            error={errors.floor?.message}
            {...register("floor")}
          />
        ) : null}
        {visible("totalFloors") ? (
          <Input
            label={label("totalFloors", text.totalFloors)}
            inputMode="numeric"
            error={errors.totalFloors?.message}
            {...register("totalFloors")}
          />
        ) : null}
        {visible("yearBuilt") ? (
          <Input
            label={label("yearBuilt", text.yearBuilt)}
            inputMode="numeric"
            maxLength={4}
            error={errors.yearBuilt?.message}
            {...register("yearBuilt")}
          />
        ) : null}
        {visible("heating") ? (
          <Select
            label={text.heating}
            placeholder={text.notSpecified}
            options={heatingTypes.map((value) => ({ value, label: bs.enums.heating[value] }))}
            {...register("heating")}
          />
        ) : null}
        {visible("condition") ? (
          <Select
            label={text.condition}
            placeholder={text.notSpecified}
            options={propertyConditions.map((value) => ({ value, label: bs.enums.condition[value] }))}
            {...register("condition")}
          />
        ) : null}
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="border-b pb-2 text-label text-tinta-2 uppercase">{text.documents}</h2>
        <div className="flex flex-col gap-5">
          {(
            [
              ["isRegistered", text.isRegistered],
              ["hasBuildingPermit", text.hasBuildingPermit],
              ...(visible("hasUsagePermit") ? [["hasUsagePermit", text.hasUsagePermit] as const] : []),
            ] as const
          ).map(([name, legend]) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <SegmentedControl
                  name={field.name}
                  legend={legend}
                  options={triStateOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="border-b pb-2 text-label text-tinta-2 uppercase">{text.features}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {featureGroupsFor(type).map((group) => (
            <fieldset key={group} className="flex flex-col gap-3">
              <legend className="mb-2 text-small font-medium">{text.featureGroups[group]}</legend>
              {featureGroups[group].map((feature) => (
                <Checkbox key={feature} label={bs.enums.feature[feature]} value={feature} {...register("features")} />
              ))}
            </fieldset>
          ))}
        </div>
      </section>

      <WizardFooter>
        <Button variant="ghost" onClick={() => goToStep(2)}>
          {bs.listingForm.back}
        </Button>
        <Button type="submit" size="lg" loading={isSubmitting}>
          {bs.listingForm.next}
        </Button>
      </WizardFooter>
    </form>
  );
}
