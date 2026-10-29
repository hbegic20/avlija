import L from "leaflet";

export const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const municipalityZoom = 13;
export const pinZoom = 16;
export const approximateRadiusMetres = 300;

export const squarePinIcon = L.divIcon({
  className: "map-pin",
  html: '<span class="block size-3.5 border-2 border-papir bg-crijep"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const outlinePathClasses = "stroke-tinta-2";
export const approximateAreaPathClasses = "fill-crijep stroke-crijep";
