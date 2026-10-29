import { cn } from "@/lib/cn";
import { formatKMAmount } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";

type PriceTagProps = {
  priceKm: number | null;
  negotiable?: boolean;
  areaM2?: number | null;
  className?: string;
};

function pricePerSquareMetre(priceKm: number, areaM2: number): string {
  return bs.price.perSquareMetre(formatKMAmount(Math.round(priceKm / areaM2)));
}

export function PriceTag({ priceKm, negotiable = false, areaM2, className }: PriceTagProps) {
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
      {secondaryLine ? <p className="font-mono text-mono text-tinta-2">{secondaryLine}</p> : null}
    </div>
  );
}
