export function parseListingSegment(segment: string): number | null {
  const match = /^(\d{1,9})(?:-|$)/.exec(segment);
  return match ? Number(match[1]) : null;
}
