import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { formatDate } from "@/lib/format";
import { legalCommon, legalUpdatedAt, type LegalSection } from "@/lib/i18n/legal-bs";

export function LegalDocument({
  title,
  intro,
  sections,
  before,
}: {
  title: string;
  intro: string;
  sections: readonly LegalSection[];
  before?: ReactNode;
}) {
  return (
    <Container className="py-10">
      <article className="flex max-w-[720px] flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="border-t-2 border-t-tinta pt-3 font-display text-h1">{title}</h1>
          <p className="text-tinta-2">{intro}</p>
        </header>
        {before}
        {sections.map((section, index) => (
          <section key={section.title} className="flex flex-col gap-3 border-t pt-5">
            <h2 className="flex items-baseline gap-3 font-display text-h3">
              <span className="font-mono text-mono text-tinta-2">{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items ? (
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-tinta-3">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
        <p className="border-t pt-4 font-mono text-label text-tinta-2">{legalCommon.updated(formatDate(legalUpdatedAt))}</p>
      </article>
    </Container>
  );
}
