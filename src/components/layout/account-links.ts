import { adminRoutes } from "@/lib/admin/routes";
import { authRoutes } from "@/lib/auth/routes";
import { favoritesRoutes } from "@/lib/favorites/routes";
import { bs } from "@/lib/i18n/bs";
import { listingRoutes } from "@/lib/listings/routes";

export const accountLinks = [
  { href: authRoutes.dashboard, label: bs.account.overview },
  { href: listingRoutes.mine, label: bs.account.myListings },
  { href: favoritesRoutes.page, label: bs.account.favorites },
  { href: authRoutes.profile, label: bs.account.profile },
] as const;

export type HeaderUser = {
  fullName: string;
  initials: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export const adminLink = { href: adminRoutes.overview, label: bs.account.admin } as const;
