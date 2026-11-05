"use client";

import Image from "next/image";
import type { DragEvent, ReactNode } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import type { ListingImage } from "@/lib/listings/types";
import type { PendingUpload } from "./use-photo-uploads";

const text = bs.listingForm.photos;
const iconProps = { "aria-hidden": true, size: 16, strokeWidth: 1.5 } as const;

function TileIconButton({
  label,
  title,
  tone = "default",
  disabled,
  onClick,
  children,
}: {
  label: string;
  title?: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-xs hover:bg-papir-2 disabled:opacity-30",
        tone === "danger" ? "text-greska" : "text-tinta-2 hover:text-tinta",
      )}
    >
      {children}
    </button>
  );
}

export function PhotoTile({
  image,
  index,
  isLast,
  dragging,
  onMove,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  image: ListingImage;
  index: number;
  isLast: boolean;
  dragging: boolean;
  onMove: (offset: number) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (event: DragEvent<HTMLLIElement>) => void;
  onDragEnd: () => void;
}) {
  const photoLabel = text.photoAlt(index + 1);
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn("flex flex-col bg-papir", dragging && "opacity-40")}
    >
      <div className="relative aspect-4/3 cursor-grab overflow-hidden active:cursor-grabbing">
        <Image
          src={image.publicUrl}
          alt={photoLabel}
          fill
          sizes="(min-width: 1024px) 220px, 50vw"
          className="object-cover"
          draggable={false}
        />
        {index === 0 ? (
          <span className="absolute top-2 left-2 bg-tinta px-2 py-1 font-mono text-label text-papir uppercase">
            {text.cover}
          </span>
        ) : null}
        <span className="absolute right-2 bottom-2 bg-papir px-1.5 py-0.5 font-mono text-label">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1 border-t px-1 py-1">
        <div className="flex">
          <TileIconButton
            label={`${text.moveEarlier}: ${photoLabel}`}
            title={text.moveEarlier}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowLeft {...iconProps} />
          </TileIconButton>
          <TileIconButton
            label={`${text.moveLater}: ${photoLabel}`}
            title={text.moveLater}
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            <ArrowRight {...iconProps} />
          </TileIconButton>
          {index > 0 ? (
            <TileIconButton label={`${text.setCover}: ${photoLabel}`} title={text.setCover} onClick={() => onMove(-index)}>
              <Star {...iconProps} />
            </TileIconButton>
          ) : null}
        </div>
        <TileIconButton label={`${text.remove}: ${photoLabel}`} title={text.remove} tone="danger" onClick={onRemove}>
          <Trash2 {...iconProps} />
        </TileIconButton>
      </div>
    </li>
  );
}

function uploadStatusLabel(upload: PendingUpload): string {
  switch (upload.status) {
    case "compressing":
      return text.compressing;
    case "uploading":
      return `${text.uploading} ${Math.round(upload.progress * 100)}%`;
    case "failed":
      return text.failed;
  }
}

export function UploadTile({
  upload,
  onRetry,
  onDismiss,
}: {
  upload: PendingUpload;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const failed = upload.status === "failed";
  return (
    <li className="flex flex-col bg-papir">
      <div className="relative aspect-4/3 overflow-hidden">
        <Image src={upload.previewUrl} alt="" fill unoptimized sizes="220px" className="object-cover opacity-50" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-papir p-2">
          <span className={cn("font-mono text-label", failed ? "text-greska" : "text-tinta-2")}>
            {uploadStatusLabel(upload)}
          </span>
          <span className="block h-1 w-full bg-papir-3" aria-hidden="true">
            <span
              className={cn("block h-full", failed ? "bg-greska" : "bg-crijep")}
              style={{ width: `${Math.round(upload.progress * 100)}%` }}
            />
          </span>
        </div>
      </div>
      {failed ? (
        <div className="flex items-center justify-between border-t px-1 py-1">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-8 items-center gap-1 rounded-xs px-2 text-small hover:bg-papir-2"
          >
            <RotateCcw {...iconProps} />
            {text.retry}
          </button>
          <TileIconButton label={text.remove} tone="danger" onClick={onDismiss}>
            <Trash2 {...iconProps} />
          </TileIconButton>
        </div>
      ) : null}
    </li>
  );
}
