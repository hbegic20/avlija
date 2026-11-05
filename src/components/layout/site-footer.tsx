import Link from "next/link";
import { sbkMunicipalities } from "@/lib/domain/municipalities";
import { bs } from "@/lib/i18n/bs";
import { Container } from "./container";
import { Logo } from "./logo";
import { routes } from "./routes";

const footerLinkClasses = "text-tinta-2 underline-offset-3 hover:text-tinta hover:underline";

const legalLinks = [
  { href: routes.terms, label: bs.footer.terms },
  { href: routes.privacy, label: bs.footer.privacy },
  { href: routes.contact, label: bs.footer.contact },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t print:hidden">
      <Container className="grid gap-8 py-8 md:grid-cols-[1fr_2fr] lg:grid-cols-[1fr_2fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-[32ch] text-small text-tinta-2">{bs.site.description}</p>
        </div>
        <nav aria-labelledby="footer-municipalities">
          <h2 id="footer-municipalities" className="mb-3 text-label text-tinta-2 uppercase">
            {bs.footer.municipalities}
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-mono uppercase sm:grid-cols-3">
            {sbkMunicipalities.map((municipality) => (
              <li key={municipality.slug}>
                <Link href={routes.municipality(municipality.slug)} className={footerLinkClasses}>
                  {municipality.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-legal">
          <h2 id="footer-legal" className="mb-3 text-label text-tinta-2 uppercase">
            {bs.footer.legal}
          </h2>
          <ul className="flex flex-col gap-1.5 text-small">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClasses}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container>
        <p className="border-t py-4 font-mono text-label tracking-[0.08em] text-tinta-2 uppercase">
          {bs.site.name} · {bs.site.region}
        </p>
      </Container>
    </footer>
  );
}
