"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { formatKM, formatListingNumber } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import type { ListingPin } from "@/lib/listings/summary";
import { tileAttribution, tileUrl } from "./map-config";

const clusterCellPixels = 56;
const cantonCentre: [number, number] = [44.12, 17.65];

type Cluster = { key: string; lat: number; lng: number; pins: ListingPin[] };

function pinIcon(highlighted: boolean) {
  const size = highlighted ? 20 : 14;
  return L.divIcon({
    className: "map-pin",
    html: `<span class="block ${highlighted ? "size-5 border-tinta" : "size-3.5 border-papir"} border-2 bg-crijep"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterIcon(count: number) {
  return L.divIcon({
    className: "map-pin",
    html: `<span class="flex size-8 items-center justify-center border-2 border-papir bg-tinta font-mono text-label font-semibold text-papir">${count}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function useClusters(pins: ListingPin[]): Cluster[] {
  const map = useMap();
  const [version, setVersion] = useState(0);
  useMapEvents({
    zoomend: () => setVersion((current) => current + 1),
    moveend: () => setVersion((current) => current + 1),
  });

  return useMemo(() => {
    void version;
    const cells = new Map<string, ListingPin[]>();
    for (const pin of pins) {
      const point = map.project([pin.lat, pin.lng], map.getZoom());
      const key = `${Math.floor(point.x / clusterCellPixels)}:${Math.floor(point.y / clusterCellPixels)}`;
      cells.set(key, [...(cells.get(key) ?? []), pin]);
    }
    return [...cells.entries()].map(([key, members]) => ({
      key,
      lat: members.reduce((sum, pin) => sum + pin.lat, 0) / members.length,
      lng: members.reduce((sum, pin) => sum + pin.lng, 0) / members.length,
      pins: members,
    }));
  }, [map, pins, version]);
}

function FitToPins({ pins }: { pins: ListingPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) {
      return;
    }
    const bounds = L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, pins]);
  return null;
}

function priceLabel(pin: ListingPin): string {
  return pin.priceKm !== null && !pin.priceNegotiable ? formatKM(pin.priceKm) : bs.price.negotiable;
}

function ClusteredPins({ pins, highlightedId }: { pins: ListingPin[]; highlightedId: string | null }) {
  const map = useMap();
  const clusters = useClusters(pins);

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.pins.length > 1) {
          return (
            <Marker
              key={cluster.key}
              position={[cluster.lat, cluster.lng]}
              icon={clusterIcon(cluster.pins.length)}
              title={bs.search.clusterLabel(cluster.pins.length)}
              eventHandlers={{
                click: () =>
                  map.fitBounds(
                    L.latLngBounds(cluster.pins.map((pin) => [pin.lat, pin.lng] as [number, number])),
                    { padding: [60, 60], maxZoom: map.getZoom() + 3 },
                  ),
              }}
            />
          );
        }
        const pin = cluster.pins[0];
        const highlighted = pin.id === highlightedId;
        return (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={pinIcon(highlighted)}
            zIndexOffset={highlighted ? 1000 : 0}
            title={bs.search.pinLabel(pin.title, priceLabel(pin))}
          >
            <Popup closeButton={false}>
              <Link href={pin.path} className="flex flex-col gap-1 text-tinta no-underline">
                <span className="font-mono text-label text-tinta-2">{formatListingNumber(pin.number)}</span>
                <span className="font-display text-body font-semibold">{pin.title}</span>
                <span className="font-mono text-mono font-semibold text-crijep">{priceLabel(pin)}</span>
              </Link>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export function ListingsMap({ pins, highlightedId }: { pins: ListingPin[]; highlightedId: string | null }) {
  return (
    <MapContainer
      center={cantonCentre}
      zoom={10}
      scrollWheelZoom
      className="size-full"
      aria-label={bs.search.mapLabel}
    >
      <TileLayer url={tileUrl} attribution={tileAttribution} className="map-tiles" />
      <FitToPins pins={pins} />
      <ClusteredPins pins={pins} highlightedId={highlightedId} />
    </MapContainer>
  );
}
