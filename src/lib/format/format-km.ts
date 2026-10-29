import { formatInteger } from "./format-number";

export function formatKMAmount(amount: number): string {
  return formatInteger(amount);
}

export function formatKM(amount: number): string {
  return `${formatKMAmount(amount)} KM`;
}
