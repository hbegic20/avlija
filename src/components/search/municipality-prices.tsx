import { DataRow } from "@/components/ui/data-row";
import { Ledger } from "@/components/ui/ledger";
import { formatKMAmount } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { minComparableListings, typePriceStats } from "@/lib/listings/price-comparison";
import { municipalityPricePoints } from "@/lib/search/price-stats";

const text = bs.priceComparison;

export async function MunicipalityPrices({ slug, name }: { slug: string; name: string }) {
  const stats = typePriceStats(await municipalityPricePoints(slug));
  if (stats.length === 0) {
    return null;
  }
  return (
    <section className="flex max-w-xl flex-col gap-2">
      <Ledger title={text.municipalityTitle(name)}>
        {stats.map((entry) => (
          <DataRow
            key={entry.type}
            label={text.municipalityRow(entry.type, entry.count)}
            value={bs.listing.pricePerSquareMetreShort(formatKMAmount(entry.medianPerM2))}
          />
        ))}
      </Ledger>
      <p className="text-small text-tinta-2">{text.municipalityNote(minComparableListings)}</p>
    </section>
  );
}
