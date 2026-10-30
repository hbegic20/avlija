import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { initialsOf } from "@/lib/text/initials";
import { bs } from "@/lib/i18n/bs";
import { AccountMenu } from "./account-menu";
import type { HeaderUser } from "./account-links";
import { MobileMenu } from "./mobile-menu";
import { routes } from "./routes";

export const navLinkClasses = "font-medium text-tinta underline-offset-3 hover:underline";

async function loadHeaderUser(): Promise<HeaderUser | null> {
  const user = await getCurrentUser();
  return user ? { fullName: user.fullName, initials: initialsOf(user.fullName), avatarUrl: user.avatarUrl } : null;
}

export async function DesktopAccount() {
  const user = await loadHeaderUser();
  if (!user) {
    return (
      <Link href={routes.login} className={navLinkClasses}>
        {bs.nav.login}
      </Link>
    );
  }
  return <AccountMenu user={user} />;
}

export async function MobileAccountMenu() {
  const user = await loadHeaderUser();
  return <MobileMenu user={user} />;
}
