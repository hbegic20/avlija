"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import type { ListingImage } from "@/lib/listings/types";

const swipeThresholdPixels = 50;

function counter(index: number, total: number): string {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

const lightboxButtonClasses =
  "inline-flex size-12 items-center justify-center rounded-xs border border-papir/40 text-papir transition-colors hover:bg-papir/10 disabled:opacity-30";

export function ListingGallery({ images, altBase }: { images: ListingImage[]; altBase: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);
  const total = images.length;
  const safeIndex = Math.min(activeIndex, Math.max(total - 1, 0));
  const active = images[safeIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (lightboxOpen && !dialog.open) {
      dialog.showModal();
    } else if (!lightboxOpen && dialog.open) {
      dialog.close();
    }
  }, [lightboxOpen]);

  if (!active) {
    return (
      <div className="hatch flex aspect-4/3 w-full items-center justify-center border">
        <span className="bg-papir px-2 py-1 font-mono text-label text-tinta-2 uppercase">{bs.listing.noPhotos}</span>
      </div>
    );
  }

  const go = (offset: number) => setActiveIndex((current) => (current + offset + total) % total);
  const altFor = (index: number) => `${altBase}, ${bs.listingForm.photos.photoAlt(index + 1).toLowerCase()}`;

  const onLightboxKey = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start === null || end === undefined || Math.abs(end - start) < swipeThresholdPixels) {
      return;
    }
    go(end < start ? 1 : -1);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-4/3 w-full overflow-hidden border bg-papir-2" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={bs.detail.gallery.open(safeIndex + 1, total)}
          className="absolute inset-0 cursor-zoom-in"
        >
          <Image
            src={active.publicUrl}
            alt={altFor(safeIndex)}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </button>
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={bs.detail.gallery.previous}
              className="absolute top-1/2 left-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-xs border bg-papir text-tinta hover:bg-papir-2"
            >
              <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={bs.detail.gallery.next}
              className="absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-xs border bg-papir text-tinta hover:bg-papir-2"
            >
              <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
            </button>
          </>
        ) : null}
        <span className="pointer-events-none absolute right-3 bottom-3 bg-papir px-2 py-1 font-mono text-label text-tinta">
          {counter(safeIndex, total)}
        </span>
      </div>

      {total > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={bs.detail.gallery.label}>
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={bs.listingForm.photos.photoAlt(index + 1)}
                aria-current={index === safeIndex || undefined}
                className={cn(
                  "relative block h-16 w-20 overflow-hidden border transition-opacity",
                  index === safeIndex ? "border-2 border-tinta" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image.publicUrl} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-label={bs.detail.gallery.label}
        onClose={() => setLightboxOpen(false)}
        onKeyDown={onLightboxKey}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-tinta p-0 text-papir backdrop:bg-tinta"
      >
        <div className="flex h-full flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-mono text-mono">{counter(safeIndex, total)}</span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label={bs.detail.gallery.close}
              className={lightboxButtonClasses}
            >
              <X aria-hidden="true" size={22} strokeWidth={1.5} />
            </button>
          </div>
          <div className="relative flex-1">
            {lightboxOpen ? (
              <Image src={active.publicUrl} alt={altFor(safeIndex)} fill sizes="100vw" className="object-contain" />
            ) : null}
          </div>
          {total > 1 ? (
            <div className="flex items-center justify-center gap-4 px-4 py-4">
              <button type="button" onClick={() => go(-1)} aria-label={bs.detail.gallery.previous} className={lightboxButtonClasses}>
                <ChevronLeft aria-hidden="true" size={22} strokeWidth={1.5} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={bs.detail.gallery.next} className={lightboxButtonClasses}>
                <ChevronRight aria-hidden="true" size={22} strokeWidth={1.5} />
              </button>
            </div>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
