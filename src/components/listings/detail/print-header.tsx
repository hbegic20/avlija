import { formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { absoluteUrl } from "@/lib/seo/site-url";

export function PrintHeader({ listingNumber, path }: { listingNumber: number; path: string }) {
  return (
    <div aria-hidden="true" className="hidden border-b-2 border-b-tinta pb-3 print:flex print:items-end print:justify-between print:gap-6">
      <div className="flex flex-col gap-1">
        <p className="font-display text-h3">Avlija.</p>
        <p className="text-label text-tinta-2 uppercase">{bs.detail.printTitle}</p>
      </div>
      <div className="flex flex-col items-end gap-1 font-mono text-mono">
        <p>{formatListingNumber(listingNumber)}</p>
        <p className="text-tinta-2">{absoluteUrl(path)}</p>
      </div>
    </div>
  );
}
