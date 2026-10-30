"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { defaultMunicipality, sbkMunicipalities, type MunicipalityLink } from "@/lib/domain/municipalities";
import { formatCoordinates } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { listingsBasePath, searchParamNames } from "@/lib/search/filters";
import { Container } from "./container";

function municipalityFromUrl(pathname: string, municipalityParams: string[]): MunicipalityLink {
  const pathSlug = pathname.startsWith(`${listingsBasePath}/`) ? pathname.split("/")[2] : null;
  const slug = pathSlug ?? (municipalityParams.length === 1 ? municipalityParams[0] : null);
  return sbkMunicipalities.find((municipality) => municipality.slug === slug) ?? defaultMunicipality;
}

export function StaticCoordinatesStrip({ municipality = defaultMunicipality }: { municipality?: MunicipalityLink }) {
  return (
    <div className="border-t-2 border-b border-t-tinta">
      <Container>
        <p className="truncate py-2 font-mono text-label tracking-[0.08em] text-tinta-2 uppercase">
          {formatCoordinates(municipality.lat, municipality.lng)} · {municipality.name} · {bs.site.region}
        </p>
      </Container>
    </div>
  );
}

export function CoordinatesStrip() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const municipality = municipalityFromUrl(pathname, searchParams.getAll(searchParamNames.municipality));
  return <StaticCoordinatesStrip municipality={municipality} />;
}
