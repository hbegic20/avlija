"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hideAllUserListings } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { adminErrorMessage } from "@/lib/admin/admin-errors";
import { bs } from "@/lib/i18n/bs";
import { HideDialog } from "./hide-dialog";

export function HideAllButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        {bs.admin.users.hideAll}
      </Button>
      <HideDialog
        open={open}
        title={bs.admin.users.hideAllTitle(userName)}
        body={bs.admin.users.hideAllBody}
        onClose={() => setOpen(false)}
        onConfirm={async (input) => {
          const result = await hideAllUserListings(userId, input);
          if (result.ok) {
            setOpen(false);
            showToast(bs.admin.users.hiddenAll(result.data.count));
            router.refresh();
          } else {
            showToast(adminErrorMessage(result.error), "error");
          }
        }}
      />
    </>
  );
}
