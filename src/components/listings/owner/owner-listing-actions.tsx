"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteListing, renewListing } from "@/actions/listings";
import { changeOwnListingStatus } from "@/actions/listing-interactions";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { ListingStatus } from "@/lib/domain/enums";
import { formatDate } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { interactionErrorMessage } from "@/lib/listings/interaction-errors";
import { listingErrorMessage } from "@/lib/listings/listing-errors";

const text = bs.myListings;

type PendingAction = "renew" | "sold" | "archived" | "remove" | null;

export function OwnerListingActions({
  listingId,
  listingNumber,
  status,
  publicPath,
  editHref,
  renewable,
}: {
  listingId: string;
  listingNumber: string;
  status: ListingStatus;
  publicPath: string;
  editHref: string;
  renewable: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [running, setRunning] = useState<PendingAction>(null);
  const [, startTransition] = useTransition();

  const run = (action: Exclude<PendingAction, null>) =>
    startTransition(async () => {
      setRunning(action);
      if (action === "renew") {
        const result = await renewListing(listingId);
        if (result.ok) {
          showToast(text.notices.renewed(formatDate(result.data.expiresAt)));
        } else {
          showToast(listingErrorMessage(result.error), "error");
        }
      } else if (action === "remove") {
        const result = await deleteListing(listingId);
        setConfirmRemove(false);
        if (result.ok) {
          showToast(text.notices.removed, "info");
        } else {
          showToast(listingErrorMessage(result.error), "error");
        }
      } else {
        const result = await changeOwnListingStatus(listingId, action);
        if (result.ok) {
          showToast(text.notices.statusChanged);
        } else {
          showToast(interactionErrorMessage(result.error), "error");
        }
      }
      setRunning(null);
      router.refresh();
    });

  const isPublic = status === "active" || status === "sold";
  const canEdit = status !== "hidden" && status !== "sold";

  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      {isPublic ? (
        <Link href={publicPath} className={buttonStyles({ variant: "ghost", size: "sm" })}>
          {text.actions.view}
        </Link>
      ) : null}
      {canEdit ? (
        <Link href={editHref} className={buttonStyles({ variant: "secondary", size: "sm" })}>
          {status === "draft" ? text.actions.continue : text.actions.edit}
        </Link>
      ) : null}
      {renewable ? (
        <Button size="sm" loading={running === "renew"} onClick={() => run("renew")}>
          {text.actions.renew}
        </Button>
      ) : null}
      {status === "active" ? (
        <>
          <Button variant="secondary" size="sm" loading={running === "sold"} onClick={() => run("sold")}>
            {text.actions.markSold}
          </Button>
          <Button variant="secondary" size="sm" loading={running === "archived"} onClick={() => run("archived")}>
            {text.actions.archive}
          </Button>
        </>
      ) : null}
      <Button variant="danger" size="sm" onClick={() => setConfirmRemove(true)}>
        {text.actions.remove}
      </Button>
      <Dialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={text.confirm.removeTitle(listingNumber)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmRemove(false)} disabled={running === "remove"}>
              {text.confirm.cancel}
            </Button>
            <Button variant="danger" loading={running === "remove"} onClick={() => run("remove")}>
              {text.confirm.remove}
            </Button>
          </>
        }
      >
        <p className="text-tinta-2">{text.confirm.removeBody}</p>
      </Dialog>
    </div>
  );
}
