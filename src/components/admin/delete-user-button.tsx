"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { deleteUserAccount } from "@/actions/admin";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { adminErrorMessage, type AdminErrorCode } from "@/lib/admin/admin-errors";
import { bs } from "@/lib/i18n/bs";

const text = bs.admin.users;
const confirmWord = bs.profile.danger.confirmWord;

export function DeleteUserButton({
  userId,
  userName,
  listingCount,
}: {
  userId: string;
  userName: string;
  listingCount: number;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [errorCode, setErrorCode] = useState<AdminErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = useId();

  const close = () => {
    if (pending) {
      return;
    }
    setOpen(false);
    setTyped("");
    setErrorCode(null);
  };

  const confirm = () =>
    startTransition(async () => {
      setErrorCode(null);
      const result = await deleteUserAccount(userId, { confirmation: confirmWord });
      if (result.ok) {
        setOpen(false);
        setTyped("");
        showToast(text.userDeleted(userName));
        router.refresh();
      } else {
        setErrorCode(result.error);
      }
    });

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        {text.deleteUser}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={text.deleteUserTitle(userName)}
        actions={
          <>
            <Button variant="ghost" onClick={close} disabled={pending}>
              {text.cancel}
            </Button>
            <Button variant="danger" loading={pending} disabled={typed !== confirmWord} onClick={confirm}>
              {text.deleteUserConfirm}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-tinta-2">{text.deleteUserBody(listingCount)}</p>
          {errorCode ? <FormAlert tone="error">{adminErrorMessage(errorCode)}</FormAlert> : null}
          <Input
            id={inputId}
            label={bs.profile.danger.confirmLabel(confirmWord)}
            value={typed}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            onChange={(event) => setTyped(event.target.value.toLocaleUpperCase("bs-BA"))}
          />
        </div>
      </Dialog>
    </>
  );
}
