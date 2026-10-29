import { appTimeZone } from "./locale";

const datePartsFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: appTimeZone,
});

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = datePartsFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("day")}. ${part("month")}. ${part("year")}.`;
}
