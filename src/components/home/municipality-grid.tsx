import Link from "next/link";
import { formatInteger } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import type { MunicipalityWithCount } from "@/lib/search/queries";
import { listingsBasePath } from "@/lib/search/filters";

export function MunicipalityGrid({ municipalities }: { municipalities: MunicipalityWithCount[] }) {
  return (
    <ul className="grid grid-cols-2 border-t border-l sm:grid-cols-3 lg:grid-cols-4">
      {municipalities.map((municipality) => (
        <li key={municipality.slug} className="border-r border-b">
          <Link
            href={`${listingsBasePath}/${municipality.slug}`}
            aria-label={bs.municipalityCount(municipality.name, municipality.activeCount)}
            className="group flex h-full items-baseline justify-between gap-3 bg-papir px-4 py-4 transition-colors hover:bg-papir-2"
          >
            <span className="font-medium underline-offset-3 group-hover:underline">{municipality.name}</span>
            <span className="font-mono text-mono text-tinta-2">{formatInteger(municipality.activeCount)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
