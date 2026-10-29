"use client";

import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { bs } from "@/lib/i18n/bs";
import {
  approximateAreaPathClasses,
  approximateRadiusMetres,
  pinZoom,
  squarePinIcon,
  tileAttribution,
  tileUrl,
} from "./map-config";

function EnableWheelZoomOnClick() {
  const map = useMapEvents({
    click() {
      map.scrollWheelZoom.enable();
    },
  });
  return null;
}

export function LocationMap({ lat, lng, precise }: { lat: number; lng: number; precise: boolean }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={precise ? pinZoom : 15}
      scrollWheelZoom={false}
      className="aspect-4/3 w-full border md:aspect-16/9"
      aria-label={precise ? bs.listing.exactLocation : bs.listing.approximateLocation}
    >
      <TileLayer url={tileUrl} attribution={tileAttribution} className="map-tiles" />
      <EnableWheelZoomOnClick />
      {precise ? (
        <Marker position={[lat, lng]} icon={squarePinIcon} keyboard={false} />
      ) : (
        <Circle
          center={[lat, lng]}
          radius={approximateRadiusMetres}
          pathOptions={{ className: approximateAreaPathClasses, weight: 1.5, dashArray: "6 4", fillOpacity: 0.08 }}
        />
      )}
    </MapContainer>
  );
}
