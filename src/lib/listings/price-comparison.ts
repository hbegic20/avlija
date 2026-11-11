import { propertyTypes, type PropertyType } from "@/lib/domain/enums";

export const minComparableListings = 5;
const sameRangePercent = 5;

export type PricePoint = { id: string; type: PropertyType; pricePerM2: number };
export type TypePriceStats = { type: PropertyType; count: number; medianPerM2: number };
export type PriceComparison = { pricePerM2: number; medianPerM2: number; count: number; differencePercent: number };
export type PricePosition = "below" | "same" | "above";

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function typePriceStats(points: readonly PricePoint[]): TypePriceStats[] {
  return propertyTypes.flatMap((type) => {
    const prices = points.filter((point) => point.type === type).map((point) => point.pricePerM2);
    return prices.length >= minComparableListings
      ? [{ type, count: prices.length, medianPerM2: Math.round(median(prices)) }]
      : [];
  });
}

export function compareListingPrice(
  listing: { id: string; type: PropertyType; pricePerM2: number | null },
  points: readonly PricePoint[],
): PriceComparison | null {
  if (listing.pricePerM2 === null || listing.pricePerM2 <= 0) {
    return null;
  }
  const others = points
    .filter((point) => point.type === listing.type && point.id !== listing.id)
    .map((point) => point.pricePerM2);
  if (others.length < minComparableListings) {
    return null;
  }
  const medianPerM2 = median(others);
  return {
    pricePerM2: Math.round(listing.pricePerM2),
    medianPerM2: Math.round(medianPerM2),
    count: others.length,
    differencePercent: Math.round(((listing.pricePerM2 - medianPerM2) / medianPerM2) * 100),
  };
}

export function pricePosition(differencePercent: number): PricePosition {
  if (differencePercent <= -sameRangePercent) {
    return "below";
  }
  return differencePercent >= sameRangePercent ? "above" : "same";
}
