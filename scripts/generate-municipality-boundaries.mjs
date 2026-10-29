import { writeFileSync } from "node:fs";

const municipalities = [
  { slug: "bugojno", name: "Bugojno" },
  { slug: "busovaca", name: "Busovača" },
  { slug: "dobretici", name: "Dobretići" },
  { slug: "donji-vakuf", name: "Donji Vakuf" },
  { slug: "fojnica", name: "Fojnica" },
  { slug: "gornji-vakuf-uskoplje", name: "Gornji Vakuf-Uskoplje" },
  { slug: "jajce", name: "Jajce" },
  { slug: "kiseljak", name: "Kiseljak" },
  { slug: "kresevo", name: "Kreševo" },
  { slug: "novi-travnik", name: "Novi Travnik" },
  { slug: "travnik", name: "Travnik" },
  { slug: "vitez", name: "Vitez" },
];

const outputPath = "src/lib/geo/sbk-boundaries.ts";
const simplificationDegrees = 0.0005;
const coordinateDecimals = 5;
const politeDelayMs = 1100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (value) => Number(value.toFixed(coordinateDecimals));

async function search(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("polygon_threshold", String(simplificationDegrees));
  url.searchParams.set("limit", "5");
  const response = await fetch(url, { headers: { "User-Agent": "avlija-boundary-generator/1.0" } });
  if (!response.ok) {
    throw new Error(`Nominatim ${response.status} for ${query}`);
  }
  return response.json();
}

function isSbkMunicipalityBoundary(result) {
  const polygonal = result.geojson?.type === "Polygon" || result.geojson?.type === "MultiPolygon";
  return (
    polygonal &&
    result.category === "boundary" &&
    result.type === "administrative" &&
    result.display_name.includes("Srednjobosanski")
  );
}

function toPolygons(geojson) {
  const polygons = geojson.type === "Polygon" ? [geojson.coordinates] : geojson.coordinates;
  return polygons.map((polygon) => polygon.map((ring) => ring.map(([lng, lat]) => [round(lng), round(lat)])));
}

const boundaries = [];
for (const municipality of municipalities) {
  let match = null;
  for (const prefix of ["Općina", "Grad"]) {
    const results = await search(`${prefix} ${municipality.name}`);
    await sleep(politeDelayMs);
    match = results.find(isSbkMunicipalityBoundary) ?? null;
    if (match) {
      break;
    }
  }
  if (!match) {
    throw new Error(`No boundary found for ${municipality.name}`);
  }
  const polygons = toPolygons(match.geojson);
  const points = polygons.flat(2).length;
  console.log(`${municipality.name}: ${match.osm_type} ${match.osm_id}, ${polygons.length} polygon(s), ${points} points`);
  boundaries.push({ slug: municipality.slug, osmRelation: match.osm_id, polygons });
}

const body = boundaries
  .map(
    (boundary) =>
      `  {\n    slug: ${JSON.stringify(boundary.slug)},\n    osmRelation: ${boundary.osmRelation},\n    polygons: ${JSON.stringify(boundary.polygons)},\n  },`,
  )
  .join("\n");

const source = `export type LngLat = readonly [number, number];
export type Ring = readonly LngLat[];
export type PolygonRings = readonly Ring[];

export type MunicipalityBoundary = {
  slug: string;
  osmRelation: number;
  polygons: readonly PolygonRings[];
};

export const sbkBoundaries: readonly MunicipalityBoundary[] = [
${body}
];
`;

writeFileSync(outputPath, source);
console.log(`Wrote ${outputPath}`);
