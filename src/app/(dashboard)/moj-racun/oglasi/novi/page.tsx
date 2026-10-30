import type { Metadata } from "next";
import { ListingWizard } from "@/components/listings/wizard/listing-wizard";
import { requireUser } from "@/lib/auth/current-user";
import { bs } from "@/lib/i18n/bs";
import { loadMunicipalities } from "@/lib/listings/load-owned-listing";
import { listingRoutes } from "@/lib/listings/routes";
import { hasPhone } from "@/lib/profile/has-phone";
import { PageTitle } from "@/components/ui/page-title";

export const instant = false;

export const metadata: Metadata = {
  title: bs.listingForm.newTitle,
  robots: { index: false, follow: false },
};

export default async function NewListingPage() {
  const user = await requireUser(listingRoutes.create);
  const [municipalities, phoneSet] = await Promise.all([loadMunicipalities(), hasPhone(user.id)]);

  return (
    <div className="flex flex-col gap-8">
      <PageTitle>{bs.listingForm.newTitle}</PageTitle>
      <ListingWizard
        listing={null}
        images={[]}
        municipalities={municipalities}
        userId={user.id}
        hasPhone={phoneSet}
        isNew
        step={1}
        unlockedSteps={[1]}
        completedSteps={[]}
        missingSteps={[1, 2, 3, 4]}
      />
    </div>
  );
}
