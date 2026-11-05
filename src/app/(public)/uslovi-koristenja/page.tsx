import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { LegalDocument } from "@/components/legal/legal-document";
import { termsPage } from "@/lib/i18n/legal-bs";

export const metadata: Metadata = publicPageMetadata({
  title: termsPage.title,
  description: termsPage.intro,
  path: "/uslovi-koristenja",
});

export default function TermsPage() {
  return <LegalDocument title={termsPage.title} intro={termsPage.intro} sections={termsPage.sections} />;
}
