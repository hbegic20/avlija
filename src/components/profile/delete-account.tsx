"use client";

import { useId, useState, useTransition } from "react";
import { deleteAccount } from "@/actions/profile";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { bs } from "@/lib/i18n/bs";

const confirmWord = bs.profile.danger.confirmWord;

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputId = useId();

  const close = () => {
    if (pending) {
      return;
    }
    setOpen(false);
    setTyped("");
    setFailed(false);
  };

  const confirm = () =>
    startTransition(async () => {
      setFailed(false);
      const result = await deleteAccount({ confirmation: confirmWord });
      if (result && !result.ok) {
        setFailed(true);
      }
    });

  return (
    <section className="grid gap-4 border-t py-8 md:grid-cols-[260px_1fr] md:gap-10">
      <h2 className="font-display text-h3 text-greska">{bs.profile.danger.title}</h2>
      <div className="flex max-w-[520px] flex-col items-start gap-4">
        <p className="text-small text-tinta-2">{bs.profile.danger.description}</p>
        <Button variant="danger" onClick={() => setOpen(true)}>
          {bs.profile.danger.open}
        </Button>
      </div>
      <Dialog
        open={open}
        onClose={close}
        title={bs.profile.danger.dialogTitle}
        actions={
          <>
            <Button variant="ghost" onClick={close} disabled={pending}>
              {bs.profile.danger.cancel}
            </Button>
            <Button variant="danger" loading={pending} disabled={typed !== confirmWord} onClick={confirm}>
              {bs.profile.danger.confirm}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-tinta-2">{bs.profile.danger.dialogBody}</p>
          {failed ? <FormAlert tone="error">{bs.profile.danger.failed}</FormAlert> : null}
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
    </section>
  );
}
