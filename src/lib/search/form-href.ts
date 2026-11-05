export function searchHrefFromForm(form: HTMLFormElement, basePath: string): string {
  const params = new URLSearchParams();
  for (const [name, value] of new FormData(form)) {
    if (typeof value === "string" && value.trim() !== "") {
      params.append(name, value.trim());
    }
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
