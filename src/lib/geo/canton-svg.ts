import "server-only";
import { sbkMunicipalities } from "@/lib/domain/municipalities";
import { sbkBoundaries, type LngLat, type Ring } from "./sbk-boundaries";

export type CantonShape = {
  slug: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
};

export type CantonSvg = {
  viewBox: string;
  shapes: CantonShape[];
};

const svgWidth = 1000;
const displayToleranceDegrees = 0.0015;

function perpendicularDistance([x, y]: LngLat, [x1, y1]: LngLat, [x2, y2]: LngLat): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  return length === 0 ? Math.hypot(x - x1, y - y1) : Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length;
}

function simplify(points: Ring, tolerance: number): LngLat[] {
  if (points.length <= 2) {
    return [...points];
  }
  let index = 0;
  let maxDistance = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }
  if (maxDistance <= tolerance) {
    return [points[0], points[points.length - 1]];
  }
  const left = simplify(points.slice(0, index + 1), tolerance);
  const right = simplify(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

function ringArea(ring: readonly LngLat[]): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return area / 2;
}

function ringCentroid(ring: readonly LngLat[]): LngLat {
  const area = ringArea(ring);
  let x = 0;
  let y = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const factor = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    x += (ring[j][0] + ring[i][0]) * factor;
    y += (ring[j][1] + ring[i][1]) * factor;
  }
  return [x / (6 * area), y / (6 * area)];
}

function buildCantonSvg(): CantonSvg {
  const allPoints = sbkBoundaries.flatMap((boundary) => boundary.polygons.flatMap((rings) => rings.flat()));
  const minLng = Math.min(...allPoints.map(([lng]) => lng));
  const maxLng = Math.max(...allPoints.map(([lng]) => lng));
  const minLat = Math.min(...allPoints.map(([, lat]) => lat));
  const maxLat = Math.max(...allPoints.map(([, lat]) => lat));
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const scale = svgWidth / ((maxLng - minLng) * lngScale);
  const svgHeight = Math.round((maxLat - minLat) * scale);
  const project = ([lng, lat]: LngLat): [number, number] => [
    Math.round((lng - minLng) * lngScale * scale * 10) / 10,
    Math.round((maxLat - lat) * scale * 10) / 10,
  ];

  const shapes = sbkBoundaries.map((boundary) => {
    const path = boundary.polygons
      .flatMap((rings) =>
        rings.map((ring) => {
          const points = simplify(ring, displayToleranceDegrees).map(project);
          return `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
        }),
      )
      .join("");
    const largestOuter = boundary.polygons
      .map((rings) => rings[0])
      .reduce((largest, ring) => (Math.abs(ringArea(ring)) > Math.abs(ringArea(largest)) ? ring : largest));
    const [labelX, labelY] = project(ringCentroid(largestOuter));
    const name = sbkMunicipalities.find((municipality) => municipality.slug === boundary.slug)?.name ?? boundary.slug;
    return { slug: boundary.slug, name, path, labelX, labelY };
  });

  return { viewBox: `0 0 ${svgWidth} ${svgHeight}`, shapes };
}

export const cantonSvg: CantonSvg = buildCantonSvg();
