import { formatInteger } from "./format-number";

export const kmPerEuro = 1.95583;

export function formatEURFromKM(amountKm: number): string {
  return `${formatInteger(amountKm / kmPerEuro)} €`;
}
