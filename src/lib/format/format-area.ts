import { formatDecimal } from "./format-number";

export function formatArea(squareMetres: number): string {
  return `${formatDecimal(squareMetres)} m²`;
}
