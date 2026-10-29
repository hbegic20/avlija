import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { buttonStyles } from "@/components/ui/button";
import { defaultMapCentre } from "@/lib/domain/municipalities";
import { bs } from "@/lib/i18n/bs";
import { Container } from "./container";
import { CoordinatesStrip } from "./coordinates-strip";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { routes } from "./routes";

const navLinkClasses = "font-medium text-tinta underline-offset-3 hover:underline";

export function SiteHeader() {
  return (
    <header>
      <CoordinatesStrip name={defaultMapCentre.name} lat={defaultMapCentre.lat} lng={defaultMapCentre.lng} />
      <div className="border-b">
        <Container className="flex items-center justify-between gap-4 py-4">
          <Logo />
          <nav aria-label={bs.nav.main} className="hidden items-center gap-6 md:flex">
            <Link href={routes.listings} className={navLinkClasses}>
              {bs.nav.listings}
            </Link>
            <Link href={routes.login} className={navLinkClasses}>
              {bs.nav.login}
            </Link>
            <ThemeSwitcher name="theme-desktop" />
            <Link href={routes.newListing} className={buttonStyles()}>
              {bs.nav.publish}
            </Link>
          </nav>
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </Container>
      </div>
    </header>
  );
}
