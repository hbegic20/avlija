"use client";

import { useState, useTransition } from "react";
import { PenLine } from "lucide-react";
import { suggestListingText } from "@/actions/ai";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { bs } from "@/lib/i18n/bs";
import { listingTextErrorMessage, type ListingTextErrorCode } from "@/lib/listings/listing-text-errors";
import type { ListingTextRequest, ListingTextSuggestion } from "@/lib/validation/listing-text";

const text = bs.listingForm.basics.suggestion;

type SuggestionState =
  | { kind: "idle" }
  | { kind: "suggested"; suggestion: ListingTextSuggestion }
  | { kind: "applied" }
  | { kind: "failed"; error: ListingTextErrorCode };

export function ListingTextHelper({
  readRequest,
  onApply,
}: {
  readRequest: () => ListingTextRequest;
  onApply: (suggestion: ListingTextSuggestion) => void;
}) {
  const [state, setState] = useState<SuggestionState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  const request = () =>
    startTransition(async () => {
      const result = await suggestListingText(readRequest());
      setState(result.ok ? { kind: "suggested", suggestion: result.data } : { kind: "failed", error: result.error });
    });

  const apply = (suggestion: ListingTextSuggestion) => {
    onApply(suggestion);
    setState({ kind: "applied" });
  };

  return (
    <section aria-labelledby="listing-text-helper" className="flex flex-col gap-4 border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-prose flex-col gap-1">
          <h2 id="listing-text-helper" className="text-label text-tinta-2 uppercase">
            {text.label}
          </h2>
          <p className="text-small text-tinta-2">{text.helper}</p>
        </div>
        <Button variant="secondary" size="sm" loading={pending} onClick={request}>
          <PenLine aria-hidden="true" size={18} strokeWidth={1.5} />
          {state.kind === "suggested" ? text.again : text.request}
        </Button>
      </div>

      {state.kind === "failed" ? <FormAlert tone="error">{listingTextErrorMessage(state.error)}</FormAlert> : null}
      {state.kind === "applied" ? <FormAlert tone="success">{text.applied}</FormAlert> : null}

      {state.kind === "suggested" ? (
        <div className="flex flex-col gap-3 bg-papir-2 p-4" aria-live="polite">
          <p className="font-semibold">{state.suggestion.title}</p>
          <p className="whitespace-pre-line">{state.suggestion.description}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => apply(state.suggestion)}>
              {text.apply}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setState({ kind: "idle" })}>
              {text.dismiss}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
