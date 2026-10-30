import Link from "next/link";
import { Suspense } from "react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { buttonStyles } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { bs } from "@/lib/i18n/bs";
import { Container } from "./container";
import { CoordinatesStrip, StaticCoordinatesStrip } from "./coordinates-strip";
import { DesktopAccount, MobileAccountMenu, navLinkClasses } from "./header-account";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { routes } from "./routes";

export function SiteHeader() {
  return (
    <header>
      <Suspense fallback={<StaticCoordinatesStrip />}>
        <CoordinatesStrip />
      </Suspense>
      <div className="border-b">
        <Container className="flex items-center justify-between gap-4 py-4">
          <Logo />
          <nav aria-label={bs.nav.main} className="hidden items-center gap-6 md:flex">
            <Link href={routes.listings} className={navLinkClasses}>
              {bs.nav.listings}
            </Link>
            <Suspense fallback={<Skeleton className="h-10 w-16" />}>
              <DesktopAccount />
            </Suspense>
            <ThemeSwitcher name="theme-desktop" />
            <Link href={routes.newListing} className={buttonStyles()}>
              {bs.nav.publish}
            </Link>
          </nav>
          <div className="md:hidden">
            <Suspense fallback={<MobileMenu user={null} />}>
              <MobileAccountMenu />
            </Suspense>
          </div>
        </Container>
      </div>
    </header>
  );
}
