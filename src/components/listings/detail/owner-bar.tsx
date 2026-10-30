"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeOwnListingStatus } from "@/actions/listing-interactions";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { bs } from "@/lib/i18n/bs";
import { interactionErrorMessage } from "@/lib/listings/interaction-errors";

type PendingChange = "sold" | "archived" | null;

const text = bs.detail.owner;

export function OwnerBar({ listingId, editHref, isActive }: { listingId: string; editHref: string; isActive: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [change, setChange] = useState<PendingChange>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      if (!change) {
        return;
      }
      const result = await changeOwnListingStatus(listingId, change);
      setChange(null);
      if (result.ok) {
        showToast(text.done);
        router.refresh();
      } else {
        showToast(interactionErrorMessage(result.error), "error");
      }
    });

  return (
    <section aria-label={text.label} className="flex flex-col gap-3 border border-l-4 border-l-vrbas bg-papir-2 p-4">
      <p className="text-label text-tinta-2 uppercase">{text.label}</p>
      <div className="flex flex-wrap gap-2">
        <Link href={editHref} className={buttonStyles({ variant: "secondary", size: "sm" })}>
          {text.edit}
        </Link>
        {isActive ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => setChange("sold")}>
              {text.markSold}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setChange("archived")}>
              {text.archive}
            </Button>
          </>
        ) : null}
      </div>
      <Dialog
        open={change !== null}
        onClose={() => setChange(null)}
        title={change === "sold" ? text.confirmSoldTitle : text.confirmArchiveTitle}
        actions={
          <>
            <Button variant="ghost" onClick={() => setChange(null)} disabled={pending}>
              {text.cancel}
            </Button>
            <Button onClick={confirm} loading={pending}>
              {text.confirm}
            </Button>
          </>
        }
      >
        <p className="text-tinta-2">{change === "sold" ? text.confirmSoldBody : text.confirmArchiveBody}</p>
      </Dialog>
    </section>
  );
}
