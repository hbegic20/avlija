"use client";

import Link from "next/link";
import { ErrorPanel } from "@/components/errors/error-panel";
import { Container } from "@/components/layout/container";
import { Button, buttonStyles } from "@/components/ui/button";
import { bs } from "@/lib/i18n/bs";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="sadrzaj" className="flex-1">
      <Container>
        <ErrorPanel code={bs.errors.errorCode} title={bs.errors.errorTitle} text={bs.errors.errorText}>
          <Button onClick={reset}>{bs.errors.retry}</Button>
          <Link href="/" className={buttonStyles({ variant: "secondary" })}>
            {bs.errors.notFoundHome}
          </Link>
        </ErrorPanel>
        {error.digest ? <p className="pb-10 font-mono text-label text-tinta-2">{bs.errors.reference(error.digest)}</p> : null}
      </Container>
    </main>
  );
}
