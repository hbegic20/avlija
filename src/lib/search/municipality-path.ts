import { sbkMunicipalities } from "@/lib/domain/municipalities";
import { listingsBasePath } from "./filters";

const municipalitySlugs = new Set(sbkMunicipalities.map((municipality) => municipality.slug));

export const notFoundRewritePath = "/_nepostojeca-stranica";

export function isUnknownMunicipalityPath(pathname: string): boolean {
  const prefix = `${listingsBasePath}/`;
  if (!pathname.startsWith(prefix)) {
    return false;
  }
  const slug = pathname.slice(prefix.length).replace(/\/$/, "");
  return slug !== "" && !slug.includes("/") && !municipalitySlugs.has(slug);
}
