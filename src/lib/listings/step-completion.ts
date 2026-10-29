import { isFieldRequired, type DetailField } from "@/lib/domain/listing-fields";
import type { EditableListing, WizardStep } from "./types";

const detailColumns: Partial<Record<DetailField, keyof EditableListing>> = {
  areaM2: "area_m2",
  landAreaM2: "land_area_m2",
  floor: "floor",
};

export function completedSteps(listing: EditableListing | null, imageCount: number): Set<WizardStep> {
  const done = new Set<WizardStep>();
  if (!listing) {
    return done;
  }
  done.add(1);
  if (listing.municipality_id !== null && listing.lat !== null && listing.lng !== null) {
    done.add(2);
  }
  const detailsComplete = (Object.keys(detailColumns) as DetailField[]).every((field) => {
    const column = detailColumns[field];
    return !isFieldRequired(listing.type, field) || (column !== undefined && listing[column] !== null);
  });
  if (detailsComplete) {
    done.add(3);
  }
  if (imageCount > 0) {
    done.add(4);
  }
  return done;
}

export function unlockedSteps(listing: EditableListing | null, imageCount: number): Set<WizardStep> {
  if (!listing) {
    return new Set<WizardStep>([1]);
  }
  if (listing.status !== "draft") {
    return new Set<WizardStep>([1, 2, 3, 4, 5]);
  }
  const done = completedSteps(listing, imageCount);
  const unlocked = new Set<WizardStep>([1]);
  for (const step of [1, 2, 3, 4] as const) {
    if (!done.has(step)) {
      break;
    }
    unlocked.add((step + 1) as WizardStep);
  }
  return unlocked;
}

export function missingStepsForPublish(listing: EditableListing, imageCount: number): WizardStep[] {
  const done = completedSteps(listing, imageCount);
  return ([1, 2, 3, 4] as const).filter((step) => !done.has(step));
}
