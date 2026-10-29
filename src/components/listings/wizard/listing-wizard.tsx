"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, type MouseEvent } from "react";
import { Stepper } from "@/components/ui/stepper";
import { bs } from "@/lib/i18n/bs";
import { listingRoutes } from "@/lib/listings/routes";
import type { EditableListing, ListingImage, MunicipalityRow, WizardStep } from "@/lib/listings/types";
import { StepBasics } from "./step-basics";
import { StepDetails } from "./step-details";
import { StepLocation } from "./step-location";
import { StepPhotos } from "./step-photos";
import { StepReview } from "./step-review";
import { WizardContext, type WizardContextValue } from "./wizard-context";

type ListingWizardProps = {
  listing: EditableListing | null;
  images: ListingImage[];
  municipalities: MunicipalityRow[];
  userId: string;
  hasPhone: boolean;
  step: WizardStep;
  unlockedSteps: WizardStep[];
  completedSteps: WizardStep[];
  missingSteps: WizardStep[];
};

export function ListingWizard({
  listing,
  images,
  municipalities,
  userId,
  hasPhone,
  step,
  unlockedSteps,
  completedSteps,
  missingSteps,
}: ListingWizardProps) {
  const router = useRouter();
  const dirtyRef = useRef(false);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, []);

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const goToStep = useCallback(
    (target: WizardStep, listingId?: string) => {
      const id = listingId ?? listing?.id;
      dirtyRef.current = false;
      if (!id) {
        return;
      }
      router.push(listingRoutes.editStep(id, target));
    },
    [listing?.id, router],
  );

  const confirmLeavingWithChanges = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a") && dirtyRef.current && !window.confirm(bs.listingForm.unsavedChanges)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const context = useMemo<WizardContextValue>(
    () => ({ listing, images, municipalities, userId, hasPhone, missingSteps, goToStep, setDirty }),
    [listing, images, municipalities, userId, hasPhone, missingSteps, goToStep, setDirty],
  );

  return (
    <WizardContext value={context}>
      <div className="flex flex-col gap-8" onClickCapture={confirmLeavingWithChanges}>
        <Stepper
          steps={bs.listingForm.steps}
          currentIndex={step - 1}
          completedIndexes={completedSteps.map((done) => done - 1)}
          hrefForStep={(index) => {
            const target = (index + 1) as WizardStep;
            return listing && unlockedSteps.includes(target) ? listingRoutes.editStep(listing.id, target) : null;
          }}
        />
        <div className="max-w-[880px]">
          {step === 1 ? <StepBasics /> : null}
          {step === 2 ? <StepLocation /> : null}
          {step === 3 ? <StepDetails /> : null}
          {step === 4 ? <StepPhotos /> : null}
          {step === 5 ? <StepReview /> : null}
        </div>
      </div>
    </WizardContext>
  );
}
