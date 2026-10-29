import { appLocale } from "./locale";

const areaFormatter = new Intl.NumberFormat(appLocale, {
  maximumFractionDigits: 2,
  useGrouping: "always",
});

export function formatArea(squareMetres: number): string {
  return `${areaFormatter.format(squareMetres)} m²`;
}
