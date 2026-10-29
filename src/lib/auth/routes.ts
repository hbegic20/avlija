export const authRoutes = {
  login: "/prijava",
  register: "/registracija",
  forgotPassword: "/zaboravljena-lozinka",
  newPassword: "/nova-lozinka",
  callback: "/auth/callback",
  dashboard: "/moj-racun",
  profile: "/moj-racun/profil",
} as const;

export const protectedPrefixes = ["/moj-racun", "/admin"] as const;
export const guestOnlyPaths = [authRoutes.login, authRoutes.register] as const;

export const noticeParam = "poruka";
export const nextParam = "next";

export const notices = {
  passwordChanged: "lozinka-promijenjena",
  signedOut: "odjava",
  linkInvalid: "link-nevazeci",
  accountDeleted: "racun-obrisan",
  listingPublished: "oglas-objavljen",
  listingDraftSaved: "oglas-nacrt",
  listingSaved: "oglas-sacuvan",
} as const;
export type NoticeCode = (typeof notices)[keyof typeof notices];

export function loginPathWithNext(next: string): string {
  return `${authRoutes.login}?${new URLSearchParams({ [nextParam]: next }).toString()}`;
}

export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
