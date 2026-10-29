import type { Database } from "@/lib/supabase/database.types";

export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ListingImageRow = Database["public"]["Tables"]["listing_images"]["Row"];
export type MunicipalityRow = Database["public"]["Tables"]["municipalities"]["Row"];

export type EditableListing = Omit<ListingRow, "search">;

export type ListingImage = {
  id: string;
  storagePath: string;
  publicUrl: string;
  position: number;
  width: number | null;
  height: number | null;
};

export type WizardStep = 1 | 2 | 3 | 4 | 5;
export const wizardSteps: readonly WizardStep[] = [1, 2, 3, 4, 5];

export function parseWizardStep(value: string | undefined | null): WizardStep {
  const step = Number(value);
  return wizardSteps.includes(step as WizardStep) ? (step as WizardStep) : 1;
}
