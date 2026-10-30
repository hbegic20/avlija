const thousandsSeparator = ".";
const decimalSeparator = ",";

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
}

export function formatInteger(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${groupThousands(String(Math.abs(rounded)))}`;
}

export function formatDecimal(value: number, maximumFractionDigits = 2): string {
  const factor = 10 ** maximumFractionDigits;
  const rounded = Math.round(Math.abs(value) * factor) / factor;
  const [whole, fraction = ""] = String(rounded).split(".");
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  const trimmedFraction = fraction.replace(/0+$/, "");
  return `${sign}${groupThousands(whole)}${trimmedFraction ? `${decimalSeparator}${trimmedFraction}` : ""}`;
}
