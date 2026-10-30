const soldGraceDays = 30;
const dayMs = 86_400_000;

export function isGoneSoldListing(status: string, soldAt: string | null, now: number): boolean {
  if (status !== "sold") {
    return false;
  }
  return soldAt !== null && now - new Date(soldAt).getTime() > soldGraceDays * dayMs;
}
