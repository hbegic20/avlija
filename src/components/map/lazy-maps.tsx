"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const mapSkeleton = () => <Skeleton className="aspect-4/3 w-full md:aspect-16/9" />;

export const LazyLocationMap = dynamic(() => import("./location-map").then((module) => module.LocationMap), {
  ssr: false,
  loading: mapSkeleton,
});

export const LazyLocationPicker = dynamic(() => import("./location-picker").then((module) => module.LocationPicker), {
  ssr: false,
  loading: mapSkeleton,
});
