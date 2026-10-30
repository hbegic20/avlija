export function toSearchableText(value: string): string {
  return value
    .replaceAll("đ", "dj")
    .replaceAll("Đ", "Dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function slugify(value: string): string {
  return toSearchableText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
