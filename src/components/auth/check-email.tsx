"use client";

import { useEffect, useState, useTransition } from "react";
import { resendConfirmation } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { authErrorMessage, type AuthErrorCode } from "@/lib/auth/auth-errors";
import { bs } from "@/lib/i18n/bs";
import { FormAlert } from "./form-alert";

const resendCooldownSeconds = 60;

export function CheckEmail({ email }: { email: string }) {
  const [secondsLeft, setSecondsLeft] = useState(resendCooldownSeconds);
  const [pending, startTransition] = useTransition();
  const [resent, setResent] = useState(false);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const resend = () =>
    startTransition(async () => {
      setResent(false);
      setErrorCode(null);
      const result = await resendConfirmation({ email });
      if (result.ok) {
        setResent(true);
        setSecondsLeft(resendCooldownSeconds);
      } else {
        setErrorCode(result.error);
      }
    });

  return (
    <section aria-live="polite" className="flex flex-col gap-4 border bg-papir-2 p-5">
      <h2 className="font-display text-h3">{bs.auth.checkEmail.title}</h2>
      <p>{bs.auth.checkEmail.description(email)}</p>
      <p className="text-small text-tinta-2">{bs.auth.checkEmail.hint}</p>
      {resent ? <FormAlert tone="success">{bs.auth.checkEmail.resent}</FormAlert> : null}
      {errorCode ? <FormAlert tone="error">{authErrorMessage(errorCode)}</FormAlert> : null}
      <Button
        variant="secondary"
        loading={pending}
        disabled={secondsLeft > 0}
        onClick={resend}
        className="w-fit font-mono tabular-nums"
      >
        {secondsLeft > 0 ? bs.auth.checkEmail.resendIn(secondsLeft) : bs.auth.checkEmail.resend}
      </Button>
    </section>
  );
}
