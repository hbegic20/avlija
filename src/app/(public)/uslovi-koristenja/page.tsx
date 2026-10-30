import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { termsPage } from "@/lib/i18n/legal-bs";

export const metadata: Metadata = {
  title: termsPage.title,
  description: termsPage.intro,
  alternates: { canonical: "/uslovi-koristenja" },
};

export default function TermsPage() {
  return <LegalDocument title={termsPage.title} intro={termsPage.intro} sections={termsPage.sections} />;
}
