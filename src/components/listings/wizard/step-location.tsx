"use client";

import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocateFixed } from "lucide-react";
import { saveLocation } from "@/actions/listings";
import { FormAlert } from "@/components/auth/form-alert";
import { LazyLocationPicker } from "@/components/map/lazy-maps";
import type { PickedPoint } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCoordinates } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { listingErrorMessage, type ListingErrorCode } from "@/lib/listings/listing-errors";
import { locationStepSchema, type LocationFormValues } from "@/lib/validation/listing";
import { useReportDirty } from "./use-dirty-state";
import { useWizard } from "./wizard-context";
import { WizardFooter } from "./wizard-footer";

const text = bs.listingForm.location;

type GeolocationState = "idle" | "locating" | "denied" | "unavailable";

const geolocationMessages: Record<Exclude<GeolocationState, "idle" | "locating">, string> = {
  denied: text.geolocationDenied,
  unavailable: text.geolocationUnavailable,
};

export function StepLocation() {
  const { listing, municipalities, goToStep } = useWizard();
  const [errorCode, setErrorCode] = useState<ListingErrorCode | null>(null);
  const [outside, setOutside] = useState(false);
  const [geolocation, setGeolocation] = useState<GeolocationState>("idle");
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationStepSchema),
    defaultValues: {
      municipalityId: listing?.municipality_id ? String(listing.municipality_id) : "",
      neighborhood: listing?.neighborhood ?? "",
      address: listing?.address ?? "",
      locationPrecise: listing?.location_precise ?? false,
      lat: listing?.lat ?? null,
      lng: listing?.lng ?? null,
    },
  });
  useReportDirty(isDirty);

  const [municipalityId, lat, lng] = useWatch({ control, name: ["municipalityId", "lat", "lng"] });
  const municipality = useMemo(
    () => municipalities.find((entry) => String(entry.id) === municipalityId) ?? null,
    [municipalities, municipalityId],
  );
  const point: PickedPoint | null = lat !== null && lng !== null ? { lat, lng } : null;

  const placePoint = (next: PickedPoint, inside: boolean) => {
    setValue("lat", next.lat, { shouldDirty: true, shouldValidate: true });
    setValue("lng", next.lng, { shouldDirty: true });
    setOutside(!inside);
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeolocation("unavailable");
      return;
    }
    setGeolocation("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeolocation("idle");
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        void import("@/lib/geo/point-in-municipality").then(({ isPointInMunicipality }) =>
          placePoint(next, municipality ? isPointInMunicipality(municipality.slug, next.lat, next.lng) : false),
        );
      },
      (error) => setGeolocation(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    setErrorCode(null);
    if (!listing || outside) {
      return;
    }
    const result = await saveLocation(listing.id, values);
    if (result.ok) {
      goToStep(3);
    } else {
      setErrorCode(result.error);
      setOutside(result.error === "point_outside");
    }
  });

  const pointError = outside ? bs.listingForm.validation.pointOutside : errors.lat?.message;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      {errorCode && errorCode !== "point_outside" ? (
        <FormAlert tone="error">{listingErrorMessage(errorCode)}</FormAlert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={text.municipality}
          placeholder={text.municipalityPlaceholder}
          options={municipalities.map((entry) => ({ value: String(entry.id), label: entry.name }))}
          error={errors.municipalityId?.message}
          {...register("municipalityId", { onChange: () => setOutside(false) })}
        />
        <Input
          label={text.neighborhood}
          placeholder={text.neighborhoodPlaceholder}
          maxLength={80}
          error={errors.neighborhood?.message}
          {...register("neighborhood")}
        />
      </div>
      <Input
        label={text.address}
        helper={text.addressHelper}
        maxLength={160}
        error={errors.address?.message}
        {...register("address")}
      />
      <Controller
        control={control}
        name="locationPrecise"
        render={({ field }) => (
          <Checkbox
            label={text.preciseLocation}
            helper={text.preciseLocationHelper}
            checked={field.value}
            onChange={(event) => field.onChange(event.target.checked)}
            name={field.name}
            ref={field.ref}
          />
        )}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-small text-tinta-2">{text.mapHint}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={useMyLocation}
            loading={geolocation === "locating"}
            disabled={!municipality}
          >
            <LocateFixed aria-hidden="true" size={18} strokeWidth={1.5} />
            {text.useMyLocation}
          </Button>
        </div>
        {municipality ? (
          <LazyLocationPicker
            municipalitySlug={municipality.slug}
            centre={{ lat: municipality.lat, lng: municipality.lng }}
            value={point}
            onChange={placePoint}
          />
        ) : (
          <div className="hatch flex aspect-4/3 w-full items-center justify-center border md:aspect-16/9">
            <span className="bg-papir px-3 py-1.5 text-small text-tinta-2">{text.chooseMunicipalityFirst}</span>
          </div>
        )}
        <p className="font-mono text-mono text-tinta-2" aria-live="polite">
          {point ? formatCoordinates(point.lat, point.lng) : text.noPoint}
        </p>
        {pointError ? <FieldError id="location-point-error">{pointError}</FieldError> : null}
        {geolocation === "denied" || geolocation === "unavailable" ? (
          <FieldError id="location-geolocation-error">{geolocationMessages[geolocation]}</FieldError>
        ) : null}
      </div>

      <WizardFooter>
        <Button variant="ghost" onClick={() => goToStep(1)}>
          {bs.listingForm.back}
        </Button>
        <Button type="submit" size="lg" loading={isSubmitting} disabled={outside}>
          {bs.listingForm.next}
        </Button>
      </WizardFooter>
    </form>
  );
}
