import { notices } from "@/lib/auth/routes";
import type { WizardStep } from "./types";

export const stepParam = "korak";

export const listingRoutes = {
  mine: "/moj-racun/oglasi",
  create: "/moj-racun/oglasi/novi",
  edit: (listingId: string) => `/moj-racun/oglasi/${listingId}/uredi`,
  editStep: (listingId: string, step: WizardStep) => `/moj-racun/oglasi/${listingId}/uredi?${stepParam}=${step}`,
} as const;

export const listingNotices = {
  published: notices.listingPublished,
  draftSaved: notices.listingDraftSaved,
  saved: notices.listingSaved,
} as const;
