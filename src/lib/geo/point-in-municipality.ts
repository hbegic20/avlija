import { sbkBoundaries, type LngLat, type MunicipalityBoundary, type Ring } from "./sbk-boundaries";

const metresPerDegreeLatitude = 111_320;
const borderToleranceMetres = 150;

function isInsideRing([x, y]: LngLat, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) {
      inside = !inside;
    }
  }
  return inside;
}

function distanceToSegmentMetres(point: LngLat, start: LngLat, end: LngLat): number {
  const metresPerDegreeLongitude = metresPerDegreeLatitude * Math.cos((point[1] * Math.PI) / 180);
  const toMetres = ([lng, lat]: LngLat) => [lng * metresPerDegreeLongitude, lat * metresPerDegreeLatitude] as const;
  const [px, py] = toMetres(point);
  const [ax, ay] = toMetres(start);
  const [bx, by] = toMetres(end);
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToRingMetres(point: LngLat, ring: Ring): number {
  let shortest = Number.POSITIVE_INFINITY;
  for (let i = 1; i < ring.length; i += 1) {
    shortest = Math.min(shortest, distanceToSegmentMetres(point, ring[i - 1], ring[i]));
  }
  return shortest;
}

function containsPoint(boundary: MunicipalityBoundary, point: LngLat): boolean {
  return boundary.polygons.some(
    ([outer, ...holes]) => isInsideRing(point, outer) && !holes.some((hole) => isInsideRing(point, hole)),
  );
}

function isNearBorder(boundary: MunicipalityBoundary, point: LngLat): boolean {
  return boundary.polygons.some((rings) => rings.some((ring) => distanceToRingMetres(point, ring) <= borderToleranceMetres));
}

export function findBoundary(slug: string): MunicipalityBoundary | undefined {
  return sbkBoundaries.find((boundary) => boundary.slug === slug);
}

export function isPointInMunicipality(slug: string, lat: number, lng: number): boolean {
  const boundary = findBoundary(slug);
  if (!boundary) {
    return false;
  }
  const point: LngLat = [lng, lat];
  return containsPoint(boundary, point) || isNearBorder(boundary, point);
}
