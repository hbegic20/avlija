"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression, Marker as LeafletMarker } from "leaflet";
import { findBoundary, isPointInMunicipality } from "@/lib/geo/point-in-municipality";
import { bs } from "@/lib/i18n/bs";
import { municipalityZoom, outlinePathClasses, pinZoom, squarePinIcon, tileAttribution, tileUrl } from "./map-config";

export type PickedPoint = { lat: number; lng: number };

type LocationPickerProps = {
  municipalitySlug: string;
  centre: PickedPoint;
  value: PickedPoint | null;
  onChange: (point: PickedPoint, insideMunicipality: boolean) => void;
};

const arrowStepPixels = 12;
const arrowOffsets: Record<string, [number, number]> = {
  ArrowUp: [0, -arrowStepPixels],
  ArrowDown: [0, arrowStepPixels],
  ArrowLeft: [-arrowStepPixels, 0],
  ArrowRight: [arrowStepPixels, 0],
};

function Recentre({ centre, hasPoint }: { centre: PickedPoint; hasPoint: boolean }) {
  const map = useMap();
  const previousCentre = useRef<string | null>(null);
  useEffect(() => {
    const key = `${centre.lat},${centre.lng}`;
    if (previousCentre.current !== null && previousCentre.current !== key) {
      map.setView([centre.lat, centre.lng], municipalityZoom);
    }
    previousCentre.current = key;
  }, [centre.lat, centre.lng, hasPoint, map]);
  return null;
}

function FollowValue({ value }: { value: PickedPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (value && !map.getBounds().contains([value.lat, value.lng])) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), pinZoom));
    }
  }, [map, value]);
  return null;
}

function ClickToPlace({ onPick }: { onPick: (point: PickedPoint) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function KeyboardPin({ value, onPick }: { value: PickedPoint; onPick: (point: PickedPoint) => void }) {
  const map = useMap();
  const markerRef = useRef<LeafletMarker>(null);

  useEffect(() => {
    const element = markerRef.current?.getElement();
    if (!element) {
      return;
    }
    element.setAttribute("aria-label", bs.listingForm.location.pinLabel);
    element.setAttribute("role", "button");
    const handleKey = (event: KeyboardEvent) => {
      const offset = arrowOffsets[event.key];
      if (!offset) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const point = map.latLngToContainerPoint([value.lat, value.lng]).add(offset);
      const next = map.containerPointToLatLng(point);
      onPick({ lat: next.lat, lng: next.lng });
    };
    element.addEventListener("keydown", handleKey);
    return () => element.removeEventListener("keydown", handleKey);
  }, [map, onPick, value.lat, value.lng]);

  return (
    <Marker
      ref={markerRef}
      position={[value.lat, value.lng]}
      icon={squarePinIcon}
      draggable
      keyboard
      eventHandlers={{
        dragend(event) {
          const position = (event.target as LeafletMarker).getLatLng();
          onPick({ lat: position.lat, lng: position.lng });
        },
      }}
    />
  );
}

export function LocationPicker({ municipalitySlug, centre, value, onChange }: LocationPickerProps) {
  const boundary = useMemo(() => findBoundary(municipalitySlug), [municipalitySlug]);
  const outline = useMemo<LatLngExpression[][][]>(
    () =>
      (boundary?.polygons ?? []).map((rings) => rings.map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number]))),
    [boundary],
  );

  const pick = (point: PickedPoint) => onChange(point, isPointInMunicipality(municipalitySlug, point.lat, point.lng));

  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : [centre.lat, centre.lng]}
      zoom={value ? pinZoom : municipalityZoom}
      scrollWheelZoom
      className="aspect-4/3 w-full border md:aspect-16/9"
      aria-label={bs.listingForm.location.mapLabel}
    >
      <TileLayer url={tileUrl} attribution={tileAttribution} className="map-tiles" />
      {outline.length > 0 ? (
        <Polygon
          positions={outline}
          interactive={false}
          pathOptions={{ className: outlinePathClasses, weight: 1.5, dashArray: "4 3", fill: false }}
        />
      ) : null}
      <Recentre centre={centre} hasPoint={value !== null} />
      <FollowValue value={value} />
      <ClickToPlace onPick={pick} />
      {value ? <KeyboardPin value={value} onPick={pick} /> : null}
    </MapContainer>
  );
}
