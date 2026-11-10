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
const ownerText = bs.detail.owner;

type PendingAction = "renew" | "sold" | "archived" | "remove" | null;
type ConfirmableAction = "sold" | "archived" | "remove";

const confirmCopy: Record<ConfirmableAction, { title: (listingNumber: string) => string; body: string; confirm: string }> = {
  sold: { title: () => ownerText.confirmSoldTitle, body: ownerText.confirmSoldBody, confirm: ownerText.markSold },
  archived: { title: () => ownerText.confirmArchiveTitle, body: ownerText.confirmArchiveBody, confirm: ownerText.archive },
  remove: { title: text.confirm.removeTitle, body: text.confirm.removeBody, confirm: text.confirm.remove },
};

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
  const [confirming, setConfirming] = useState<ConfirmableAction | null>(null);
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
      setConfirming(null);
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
          <Button variant="secondary" size="sm" loading={running === "sold"} onClick={() => setConfirming("sold")}>
            {text.actions.markSold}
          </Button>
          <Button variant="secondary" size="sm" loading={running === "archived"} onClick={() => setConfirming("archived")}>
            {text.actions.archive}
          </Button>
        </>
      ) : null}
      <Button variant="danger" size="sm" onClick={() => setConfirming("remove")}>
        {text.actions.remove}
      </Button>
      <Dialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={confirming ? confirmCopy[confirming].title(listingNumber) : ""}
        actions={
          confirming ? (
            <>
              <Button variant="ghost" onClick={() => setConfirming(null)} disabled={running !== null}>
                {text.confirm.cancel}
              </Button>
              <Button
                variant={confirming === "remove" ? "danger" : "primary"}
                loading={running === confirming}
                onClick={() => run(confirming)}
              >
                {confirmCopy[confirming].confirm}
              </Button>
            </>
          ) : null
        }
      >
        {confirming ? <p className="text-tinta-2">{confirmCopy[confirming].body}</p> : null}
      </Dialog>
    </div>
  );
}
