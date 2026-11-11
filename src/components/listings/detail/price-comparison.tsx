import { DataRow } from "@/components/ui/data-row";
import { Ledger } from "@/components/ui/ledger";
import type { PropertyType } from "@/lib/domain/enums";
import { formatInteger, formatKMAmount } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { compareListingPrice, pricePosition, type PriceComparison } from "@/lib/listings/price-comparison";
import { municipalityPricePoints } from "@/lib/search/price-stats";

const text = bs.priceComparison;

function perSquareMetre(amount: number): string {
  return bs.listing.pricePerSquareMetreShort(formatKMAmount(amount));
}

function DifferenceRow({ comparison }: { comparison: PriceComparison }) {
  const position = pricePosition(comparison.differencePercent);
  const percent = formatInteger(Math.abs(comparison.differencePercent));
  if (position === "below") {
    return <DataRow label={text.difference} value={text.below(percent)} tone="positive" />;
  }
  return <DataRow label={text.difference} value={position === "above" ? text.above(percent) : text.same} />;
}

export async function ListingPriceComparison({
  listingId,
  type,
  pricePerM2,
  municipalitySlug,
  municipalityName,
}: {
  listingId: string;
  type: PropertyType;
  pricePerM2: number | null;
  municipalitySlug: string;
  municipalityName: string;
}) {
  if (pricePerM2 === null) {
    return null;
  }
  const points = await municipalityPricePoints(municipalitySlug);
  const comparison = compareListingPrice({ id: listingId, type, pricePerM2: Number(pricePerM2) }, points);
  if (!comparison) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2 print:break-inside-avoid">
      <Ledger title={text.title}>
        <DataRow label={text.thisListing} value={perSquareMetre(comparison.pricePerM2)} />
        <DataRow label={text.median} value={perSquareMetre(comparison.medianPerM2)} />
        <DifferenceRow comparison={comparison} />
      </Ledger>
      <p className="text-small text-tinta-2">{text.note(type, municipalityName, comparison.count)}</p>
    </div>
  );
}
