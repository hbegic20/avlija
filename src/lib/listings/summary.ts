import type { ListingStatus, PropertyType } from "@/lib/domain/enums";

export type ListingSummary = {
  id: string;
  number: number;
  title: string;
  type: PropertyType;
  status: ListingStatus;
  priceKm: number | null;
  priceNegotiable: boolean;
  areaM2: number | null;
  landAreaM2: number | null;
  rooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  neighborhood: string | null;
  isRegistered: boolean | null;
  publishedAt: string | null;
  publicLat: number | null;
  publicLng: number | null;
  locationPrecise: boolean;
  municipalityName: string | null;
  municipalitySlug: string | null;
  coverUrl: string | null;
  path: string;
  isNew: boolean;
};

export type ListingPin = {
  id: string;
  number: number;
  title: string;
  priceKm: number | null;
  priceNegotiable: boolean;
  lat: number;
  lng: number;
  precise: boolean;
  path: string;
};
