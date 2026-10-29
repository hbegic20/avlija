import { appLocale } from "./locale";

const integerFormatter = new Intl.NumberFormat(appLocale, {
  maximumFractionDigits: 0,
  useGrouping: "always",
});

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}
