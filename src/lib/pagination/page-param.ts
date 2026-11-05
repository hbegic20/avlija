export const pageParamName = "stranica";

export function parsePageParam(params: Record<string, string | string[] | undefined>): number {
  const value = params[pageParamName];
  const raw = Array.isArray(value) ? value[0] : value;
  return Math.max(1, Math.floor(Number(raw) || 1));
}

export function pageHref(basePath: string, page: number, params: Record<string, string> = {}): string {
  const search = new URLSearchParams(params);
  if (page > 1) {
    search.set(pageParamName, String(page));
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
