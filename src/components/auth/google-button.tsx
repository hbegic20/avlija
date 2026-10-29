"use client";

import { useState, useTransition } from "react";
import { signInWithGoogle } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import { bs } from "@/lib/i18n/bs";
import { FormAlert } from "./form-alert";

export function GoogleButton({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="secondary"
        size="lg"
        loading={pending}
        className="w-full"
        onClick={() =>
          startTransition(async () => {
            const result = await signInWithGoogle(next);
            if (result && !result.ok) {
              setError(authErrorMessage(result.error));
            }
          })
        }
      >
        {bs.auth.continueWithGoogle}
      </Button>
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-label text-tinta-2 uppercase" aria-hidden="true">
      <span className="h-px flex-1 bg-linija" />
      {bs.auth.or}
      <span className="h-px flex-1 bg-linija" />
    </div>
  );
}
