import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { DataRow } from "@/components/ui/data-row";
import { Ledger } from "@/components/ui/ledger";
import { contactPage } from "@/lib/i18n/legal-bs";
import { operator } from "@/lib/legal/operator";
import { PageTitle } from "@/components/ui/page-title";

export const metadata: Metadata = {
  title: contactPage.title,
  description: contactPage.intro,
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <Container className="py-10">
      <div className="flex max-w-[640px] flex-col gap-8">
        <header className="flex flex-col gap-3">
          <PageTitle>{contactPage.title}</PageTitle>
          <p className="text-tinta-2">{contactPage.intro}</p>
        </header>
        <Ledger>
          <DataRow
            label={contactPage.emailLabel}
            value={
              operator.email ? (
                <a href={`mailto:${operator.email}`} className="text-vranica underline underline-offset-3">
                  {operator.email}
                </a>
              ) : (
                contactPage.emailMissing
              )
            }
          />
        </Ledger>
        <div className="flex flex-col gap-3 border-t pt-5 text-small text-tinta-2">
          <p>{contactPage.reportHint}</p>
          <p>{contactPage.dataRequestHint}</p>
        </div>
      </div>
    </Container>
  );
}
