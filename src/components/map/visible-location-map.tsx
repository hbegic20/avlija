"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyLocationMap } from "./lazy-maps";

const preloadMargin = "300px";

export function VisibleLocationMap({ lat, lng, precise }: { lat: number; lng: number; precise: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || visible) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: preloadMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={containerRef}>
      {visible ? (
        <LazyLocationMap lat={lat} lng={lng} precise={precise} />
      ) : (
        <Skeleton className="aspect-4/3 w-full md:aspect-16/9" />
      )}
    </div>
  );
}
