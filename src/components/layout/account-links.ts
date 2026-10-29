import { bs } from "@/lib/i18n/bs";

export const accountLinks = [
  { href: "/moj-racun", label: bs.account.overview },
  { href: "/moj-racun/oglasi", label: bs.account.myListings },
  { href: "/moj-racun/sacuvano", label: bs.account.favorites },
  { href: "/moj-racun/profil", label: bs.account.profile },
] as const;

export type HeaderUser = {
  fullName: string;
  initials: string;
  avatarUrl: string | null;
};
