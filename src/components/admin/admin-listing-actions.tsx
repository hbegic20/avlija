"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { hideListing, unhideListing } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { adminErrorMessage } from "@/lib/admin/admin-errors";
import type { ListingStatus } from "@/lib/domain/enums";
import { bs } from "@/lib/i18n/bs";
import { HideDialog } from "./hide-dialog";

export function AdminListingActions({
  listingId,
  listingNumber,
  status,
}: {
  listingId: string;
  listingNumber: string;
  status: ListingStatus;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [hiding, setHiding] = useState(false);
  const [pending, startTransition] = useTransition();

  if (status === "hidden") {
    return (
      <Button
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await unhideListing(listingId);
            if (result.ok) {
              showToast(bs.admin.listings.unhiddenNotice);
              router.refresh();
            } else {
              showToast(adminErrorMessage(result.error), "error");
            }
          })
        }
      >
        {bs.admin.listings.unhide}
      </Button>
    );
  }

  if (status !== "active" && status !== "sold") {
    return null;
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setHiding(true)}>
        {bs.admin.listings.hide}
      </Button>
      <HideDialog
        open={hiding}
        title={bs.admin.hideDialog.title(listingNumber)}
        body={bs.admin.hideDialog.body}
        onClose={() => setHiding(false)}
        onConfirm={async (input) => {
          const result = await hideListing(listingId, input);
          if (result.ok) {
            setHiding(false);
            showToast(bs.admin.listings.hiddenNotice);
            router.refresh();
          } else {
            showToast(adminErrorMessage(result.error), "error");
          }
        }}
      />
    </>
  );
}
