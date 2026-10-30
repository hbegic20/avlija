"use client";

import { createContext, useContext } from "react";
import type { EditableListing, ListingImage, MunicipalityRow, WizardStep } from "@/lib/listings/types";

export type WizardContextValue = {
  listing: EditableListing | null;
  images: ListingImage[];
  municipalities: MunicipalityRow[];
  userId: string;
  hasPhone: boolean;
  isNew: boolean;
  missingSteps: WizardStep[];
  goToStep: (step: WizardStep, listingId?: string) => void;
  setDirty: (dirty: boolean) => void;
};

export const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used inside ListingWizard");
  }
  return context;
}
