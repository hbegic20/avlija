import { dayMs } from "@/lib/time/duration";

const priceReductionDays = 30;
const minimumReductionPercent = 1;

export function priceReductionPercent(priceKm: number, previousPriceKm: number): number {
  return Math.round(((previousPriceKm - priceKm) / previousPriceKm) * 100);
}

export function recentPreviousPrice(
  priceKm: number | null,
  previousPriceKm: number | null,
  reducedAt: string | null,
  now: number,
): number | null {
  if (priceKm === null || previousPriceKm === null || reducedAt === null) {
    return null;
  }
  if (now - new Date(reducedAt).getTime() >= priceReductionDays * dayMs) {
    return null;
  }
  return priceReductionPercent(priceKm, previousPriceKm) >= minimumReductionPercent ? previousPriceKm : null;
}
