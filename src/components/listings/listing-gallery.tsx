"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import type { ListingImage } from "@/lib/listings/types";

export function ListingGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[Math.min(activeIndex, images.length - 1)];

  if (!active) {
    return (
      <div className="hatch flex aspect-4/3 w-full items-center justify-center border">
        <span className="bg-papir px-2 py-1 font-mono text-label text-tinta-2 uppercase">{bs.listing.noPhotos}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-4/3 w-full overflow-hidden border bg-papir-2">
        <Image
          src={active.publicUrl}
          alt={`${title}, ${bs.listingForm.photos.photoAlt(activeIndex + 1).toLowerCase()}`}
          fill
          sizes="(min-width: 1024px) 800px, 100vw"
          className="object-cover"
          priority
        />
        <span className="absolute right-3 bottom-3 bg-papir px-2 py-1 font-mono text-label text-tinta">
          {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </span>
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={bs.listingForm.photos.photoAlt(index + 1)}
                aria-current={index === activeIndex || undefined}
                className={cn(
                  "relative block h-16 w-20 overflow-hidden border transition-opacity",
                  index === activeIndex ? "border-2 border-tinta" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image.publicUrl} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
