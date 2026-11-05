"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setUserRole } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { adminErrorMessage } from "@/lib/admin/admin-errors";
import type { UserRole } from "@/lib/domain/enums";
import { bs } from "@/lib/i18n/bs";

const text = bs.admin.users;

export function RoleButton({ userId, userName, role }: { userId: string; userName: string; role: UserRole }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const promoting = role !== "admin";
  const nextRole: UserRole = promoting ? "admin" : "user";

  const confirm = async () => {
    setSaving(true);
    const result = await setUserRole(userId, nextRole);
    setSaving(false);
    if (result.ok) {
      setOpen(false);
      showToast(text.roleChanged(userName, bs.enums.userRole[result.data.role]));
      router.refresh();
    } else {
      showToast(adminErrorMessage(result.error), "error");
    }
  };

  return (
    <>
      <Button variant={promoting ? "secondary" : "danger"} size="sm" onClick={() => setOpen(true)}>
        {promoting ? text.makeAdmin : text.removeAdmin}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={promoting ? text.makeAdminTitle(userName) : text.removeAdminTitle(userName)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              {text.cancel}
            </Button>
            <Button variant={promoting ? "primary" : "danger"} loading={saving} onClick={() => void confirm()}>
              {promoting ? text.makeAdmin : text.removeAdmin}
            </Button>
          </>
        }
      >
        <p className="text-tinta-2">{promoting ? text.makeAdminBody : text.removeAdminBody}</p>
      </Dialog>
    </>
  );
}
