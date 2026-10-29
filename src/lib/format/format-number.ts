import { appLocale } from "./locale";

const integerFormatter = new Intl.NumberFormat(appLocale, {
  maximumFractionDigits: 0,
  useGrouping: "always",
});

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

const decimalFormatter = new Intl.NumberFormat(appLocale, {
  maximumFractionDigits: 2,
  useGrouping: "always",
});

export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}
