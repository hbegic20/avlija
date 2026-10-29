const listingNumberDigits = 5;

export function formatListingNumber(listingNumber: number): string {
  return `br. ${String(listingNumber).padStart(listingNumberDigits, "0")}`;
}
