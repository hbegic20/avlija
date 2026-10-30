const maxDescriptionLength = 160;

export function descriptionSnippet(text: string): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxDescriptionLength) {
    return singleLine;
  }
  const cut = singleLine.slice(0, maxDescriptionLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 100 ? lastSpace : cut.length)}…`;
}
