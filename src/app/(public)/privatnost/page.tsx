import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/legal-document";
import { routes } from "@/components/layout/routes";
import { operator } from "@/lib/legal/operator";
import { legalCommon, privacyPage } from "@/lib/i18n/legal-bs";

export const metadata: Metadata = {
  title: privacyPage.title,
  description: privacyPage.intro,
  alternates: { canonical: "/privatnost" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title={privacyPage.title}
      intro={privacyPage.intro}
      sections={privacyPage.sections}
      before={
        <section className="flex flex-col gap-2 border bg-papir-2 p-5">
          <h2 className="text-label text-tinta-2 uppercase">{privacyPage.controllerTitle}</h2>
          <p>{privacyPage.controllerText(operator.name)}</p>
          {operator.email ? (
            <a href={`mailto:${operator.email}`} className="w-fit font-mono text-mono text-vranica underline underline-offset-3">
              {operator.email}
            </a>
          ) : (
            <Link href={routes.contact} className="w-fit text-vranica underline underline-offset-3">
              {legalCommon.contact}
            </Link>
          )}
        </section>
      }
    />
  );
}
