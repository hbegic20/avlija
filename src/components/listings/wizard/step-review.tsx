"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { finishEditing, publishListing } from "@/actions/listings";
import { FormAlert } from "@/components/auth/form-alert";
import { ListingDetailView } from "@/components/listings/listing-detail-view";
import { PhoneRequiredNotice } from "@/components/profile/phone-required-notice";
import { Button } from "@/components/ui/button";
import { bs } from "@/lib/i18n/bs";
import { listingErrorMessage, type ListingErrorCode } from "@/lib/listings/listing-errors";
import { listingRoutes } from "@/lib/listings/routes";
import { useWizard } from "./wizard-context";
import { WizardFooter } from "./wizard-footer";

const text = bs.listingForm.review;

export function StepReview() {
  const { listing, images, municipalities, hasPhone, isNew, missingSteps, goToStep } = useWizard();
  const [errorCode, setErrorCode] = useState<ListingErrorCode | null>(null);
  const [publishing, startPublish] = useTransition();
  const [finishing, startFinish] = useTransition();

  const view = useMemo(() => {
    if (!listing) {
      return null;
    }
    const municipalityName = municipalities.find((entry) => entry.id === listing.municipality_id)?.name ?? null;
    return { listing, images, municipalityName, isNew };
  }, [images, isNew, listing, municipalities]);

  if (!listing || !view) {
    return null;
  }

  const isDraft = listing.status === "draft";
  const canPublish = missingSteps.length === 0 && hasPhone;

  const publish = () =>
    startPublish(async () => {
      setErrorCode(null);
      const result = await publishListing(listing.id);
      if (result && !result.ok) {
        setErrorCode(result.error);
      }
    });

  const finish = () => startFinish(() => finishEditing(listing.id));

  return (
    <div className="flex flex-col gap-8">
      <p className="text-tinta-2">{text.intro}</p>

      {missingSteps.length > 0 ? (
        <FormAlert tone="error">
          {text.missing}
          <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {missingSteps.map((step) => (
              <Link
                key={step}
                href={listingRoutes.editStep(listing.id, step)}
                className="font-medium text-vranica underline underline-offset-3 hover:text-crijep"
              >
                {String(step).padStart(2, "0")} {bs.listingForm.steps[step - 1]}
              </Link>
            ))}
          </span>
        </FormAlert>
      ) : null}
      {!hasPhone && isDraft ? <PhoneRequiredNotice /> : null}
      {errorCode ? <FormAlert tone="error">{listingErrorMessage(errorCode)}</FormAlert> : null}

      <div className="border p-4 md:p-6">
        <ListingDetailView view={view} />
      </div>

      <WizardFooter>
        <Button variant="ghost" onClick={() => goToStep(4)}>
          {bs.listingForm.back}
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="lg" loading={finishing} onClick={finish}>
            {isDraft ? bs.listingForm.saveDraft : bs.listingForm.saveChanges}
          </Button>
          {isDraft ? (
            <Button size="lg" loading={publishing} disabled={!canPublish} onClick={publish}>
              {bs.listingForm.publish}
            </Button>
          ) : null}
        </div>
      </WizardFooter>
    </div>
  );
}
