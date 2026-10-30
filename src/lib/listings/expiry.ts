const dayMs = 86_400_000;
const expiringSoonDays = 7;
const renewWindowDays = 14;
export const maxActiveListings = 10;

export function daysUntil(isoDate: string | null, now: number): number | null {
  if (!isoDate) {
    return null;
  }
  return Math.ceil((new Date(isoDate).getTime() - now) / dayMs);
}

export function isExpiringSoon(expiresAt: string | null, now: number): boolean {
  const days = daysUntil(expiresAt, now);
  return days !== null && days < expiringSoonDays;
}

export function canRenew(status: string, expiresAt: string | null, now: number): boolean {
  if (status === "archived") {
    return true;
  }
  const days = daysUntil(expiresAt, now);
  return status === "active" && days !== null && days < renewWindowDays;
}
