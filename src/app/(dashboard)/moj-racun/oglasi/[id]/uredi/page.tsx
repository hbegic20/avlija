import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormAlert } from "@/components/auth/form-alert";
import { ListingWizard } from "@/components/listings/wizard/listing-wizard";
import { requireUser } from "@/lib/auth/current-user";
import { formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { loadMunicipalities, loadOwnedListing } from "@/lib/listings/load-owned-listing";
import { listingRoutes, stepParam } from "@/lib/listings/routes";
import { completedSteps, missingStepsForPublish, unlockedSteps } from "@/lib/listings/step-completion";
import { parseWizardStep, type WizardStep } from "@/lib/listings/types";
import { listingIdSchema } from "@/lib/validation/listing";
import { hasPhone } from "@/lib/profile/has-phone";
import { PageTitle } from "@/components/ui/page-title";

export const instant = false;

export const metadata: Metadata = {
  title: bs.listingForm.newTitle,
  robots: { index: false, follow: false },
};

export default async function EditListingPage({ params, searchParams }: PageProps<"/moj-racun/oglasi/[id]/uredi">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!listingIdSchema.safeParse(id).success) {
    notFound();
  }
  const user = await requireUser(listingRoutes.edit(id));
  const [bundle, municipalities, phoneSet] = await Promise.all([
    loadOwnedListing(id, user.id),
    loadMunicipalities(),
    hasPhone(user.id),
  ]);
  if (!bundle) {
    notFound();
  }
  const { listing, images } = bundle;
  const heading = bs.listingForm.editTitle(formatListingNumber(listing.number));

  if (listing.status === "hidden") {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle>{heading}</PageTitle>
        <FormAlert tone="error">
          {bs.listingForm.errors.hidden}
          {listing.hidden_reason ? ` ${listing.hidden_reason}` : null}
        </FormAlert>
      </div>
    );
  }

  const unlocked = unlockedSteps(listing, images.length);
  const requestedValue = query[stepParam];
  const requested = parseWizardStep(Array.isArray(requestedValue) ? requestedValue[0] : requestedValue);
  const highestUnlocked = Math.max(...unlocked) as WizardStep;
  if (!unlocked.has(requested)) {
    redirect(listingRoutes.editStep(id, highestUnlocked));
  }

  return (
    <div className="flex flex-col gap-8">
      <PageTitle>{heading}</PageTitle>
      <ListingWizard
        key={`${listing.id}-${requested}-${listing.updated_at}-${images.length}`}
        listing={listing}
        images={images}
        municipalities={municipalities}
        userId={user.id}
        hasPhone={phoneSet}
        isNew={bundle.isNew}
        step={requested}
        unlockedSteps={[...unlocked]}
        completedSteps={[...completedSteps(listing, images.length)]}
        missingSteps={missingStepsForPublish(listing, images.length)}
      />
    </div>
  );
}
