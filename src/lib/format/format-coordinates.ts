const coordinateDecimals = 4;

export function formatCoordinates(lat: number, lng: number): string {
  const latitude = `${Math.abs(lat).toFixed(coordinateDecimals)}° ${lat >= 0 ? "N" : "S"}`;
  const longitude = `${Math.abs(lng).toFixed(coordinateDecimals)}° ${lng >= 0 ? "E" : "W"}`;
  return `${latitude} · ${longitude}`;
}
