import { cn } from "@/lib/cn";
import { formatEURFromKM, formatKMAmount } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { priceReductionPercent } from "@/lib/listings/price-reduction";

type PriceTagProps = {
  priceKm: number | null;
  negotiable?: boolean;
  previousPriceKm?: number | null;
  areaM2?: number | null;
  showEuro?: boolean;
  className?: string;
};

function pricePerSquareMetre(priceKm: number, areaM2: number): string {
  return bs.price.perSquareMetre(formatKMAmount(Math.round(priceKm / areaM2)));
}

export function PriceTag({
  priceKm,
  negotiable = false,
  previousPriceKm = null,
  areaM2,
  showEuro = false,
  className,
}: PriceTagProps) {
  const secondaryLine =
    negotiable || priceKm === null
      ? bs.price.negotiable
      : areaM2
        ? pricePerSquareMetre(priceKm, areaM2)
        : null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {priceKm !== null ? (
        <p className="font-mono text-price text-crijep">
          {formatKMAmount(priceKm)}
          <span className="ml-1 font-mono text-mono font-normal text-tinta-2">KM</span>
        </p>
      ) : null}
      {previousPriceKm !== null && priceKm !== null ? (
        <p className="font-mono text-mono text-tinta-2">
          <span className="sr-only">{bs.price.previous}: </span>
          <s>{formatKMAmount(previousPriceKm)}</s> · {bs.price.reduced(priceReductionPercent(priceKm, previousPriceKm))}
        </p>
      ) : null}
      {showEuro && priceKm !== null ? (
        <p className="font-mono text-mono text-tinta-2" title={bs.price.inEuroLabel}>
          {bs.price.inEuro(formatEURFromKM(priceKm))}
          <span className="sr-only"> ({bs.price.inEuroLabel})</span>
        </p>
      ) : null}
      {secondaryLine ? <p className="font-mono text-mono text-tinta-2">{secondaryLine}</p> : null}
    </div>
  );
}
