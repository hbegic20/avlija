"use client";

import { bs } from "@/lib/i18n/bs";
import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="bs">
      <body className="bg-papir font-sans text-tinta">
        <main className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 py-20">
          <p className="border-t-2 border-t-tinta pt-3 font-mono text-label tracking-[0.08em] text-tinta-2 uppercase">
            {bs.errors.errorCode}
          </p>
          <h1 className="font-display text-h1">{bs.errors.errorTitle}</h1>
          <p className="text-tinta-2">{bs.errors.errorText}</p>
          <button
            type="button"
            onClick={reset}
            className="h-10 w-fit rounded-xs border border-crijep bg-crijep px-4 font-semibold text-na-crijep hover:bg-crijep-tamni"
          >
            {bs.errors.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
