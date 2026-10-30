import type { Metadata } from "next";
import Link from "next/link";
import { ErrorPanel } from "@/components/errors/error-panel";
import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonStyles } from "@/components/ui/button";
import { bs } from "@/lib/i18n/bs";
import { listingsBasePath } from "@/lib/search/filters";

export const metadata: Metadata = {
  title: bs.errors.notFoundTitle,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="sadrzaj" className="flex-1">
        <Container>
          <ErrorPanel code={bs.errors.notFoundCode} title={bs.errors.notFoundTitle} text={bs.errors.notFoundText}>
            <Link href={listingsBasePath} className={buttonStyles()}>
              {bs.errors.notFoundListings}
            </Link>
            <Link href="/" className={buttonStyles({ variant: "secondary" })}>
              {bs.errors.notFoundHome}
            </Link>
          </ErrorPanel>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
