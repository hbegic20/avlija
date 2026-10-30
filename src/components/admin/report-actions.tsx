"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { hideListing, resolveReport } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { adminErrorMessage } from "@/lib/admin/admin-errors";
import { bs } from "@/lib/i18n/bs";
import type { ReportResolution } from "@/lib/validation/admin";
import { HideDialog } from "./hide-dialog";

const text = bs.admin.reports;

export function ReportActions({
  reportId,
  listingId,
  listingNumber,
  canHide,
  defaultReason,
}: {
  reportId: string;
  listingId: string | null;
  listingNumber: string;
  canHide: boolean;
  defaultReason: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [hiding, setHiding] = useState(false);
  const [running, setRunning] = useState<ReportResolution | null>(null);
  const [, startTransition] = useTransition();

  const finish = (resolution: ReportResolution) =>
    startTransition(async () => {
      setRunning(resolution);
      const result = await resolveReport(reportId, resolution);
      setRunning(null);
      if (result.ok) {
        showToast(text.handled);
        router.refresh();
      } else {
        showToast(adminErrorMessage(result.error), "error");
      }
    });

  return (
    <div className="flex flex-wrap gap-2">
      {canHide && listingId ? (
        <Button variant="danger" size="sm" onClick={() => setHiding(true)}>
          {text.hide}
        </Button>
      ) : null}
      <Button variant="secondary" size="sm" loading={running === "resolved"} onClick={() => finish("resolved")}>
        {text.resolve}
      </Button>
      <Button variant="ghost" size="sm" loading={running === "dismissed"} onClick={() => finish("dismissed")}>
        {text.dismiss}
      </Button>
      {listingId ? (
        <HideDialog
          open={hiding}
          title={bs.admin.hideDialog.title(listingNumber)}
          body={bs.admin.hideDialog.body}
          defaultReason={defaultReason}
          onClose={() => setHiding(false)}
          onConfirm={async (input) => {
            const result = await hideListing(listingId, input);
            if (result.ok) {
              setHiding(false);
              showToast(text.handled);
              router.refresh();
            } else {
              showToast(adminErrorMessage(result.error), "error");
            }
          }}
        />
      ) : null}
    </div>
  );
}
