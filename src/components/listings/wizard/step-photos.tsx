"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, Camera, ImagePlus, RotateCcw, Star, Trash2 } from "lucide-react";
import { deleteImage, registerImage, reorderImages } from "@/actions/listings";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { maxListingImages } from "@/lib/domain/listing-fields";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import { listingErrorMessage } from "@/lib/listings/listing-errors";
import type { ListingImage } from "@/lib/listings/types";
import {
  isAcceptedImage,
  listingImagePath,
  prepareListingImage,
  uploadWithProgress,
} from "@/lib/listings/upload-listing-image";
import { useReportDirty } from "./use-dirty-state";
import { useWizard } from "./wizard-context";
import { WizardFooter } from "./wizard-footer";

const text = bs.listingForm.photos;
const uploadConcurrency = 3;

type UploadStatus = "compressing" | "uploading" | "failed";

type PendingUpload = {
  key: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
};

const iconProps = { "aria-hidden": true, size: 16, strokeWidth: 1.5 } as const;

function moveItem<Item>(items: Item[], from: number, to: number): Item[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function StepPhotos() {
  const { listing, images: initialImages, userId, goToStep } = useWizard();
  const [images, setImages] = useState<ListingImage[]>(initialImages);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const orderBeforeDrag = useRef<string[]>([]);

  const activeUploads = uploads.filter((upload) => upload.status !== "failed");
  useReportDirty(activeUploads.length > 0);

  const uploadsRef = useRef<PendingUpload[]>([]);
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);
  useEffect(
    () => () => {
      for (const upload of uploadsRef.current) {
        URL.revokeObjectURL(upload.previewUrl);
      }
    },
    [],
  );

  if (!listing) {
    return null;
  }

  const updateUpload = (key: string, patch: Partial<PendingUpload>) =>
    setUploads((current) => current.map((upload) => (upload.key === key ? { ...upload, ...patch } : upload)));

  const finishUpload = (key: string) =>
    setUploads((current) => {
      const done = current.find((upload) => upload.key === key);
      if (done) {
        URL.revokeObjectURL(done.previewUrl);
      }
      return current.filter((upload) => upload.key !== key);
    });

  const uploadOne = async (upload: PendingUpload) => {
    try {
      updateUpload(upload.key, { status: "compressing", progress: 0 });
      const prepared = await prepareListingImage(upload.file);
      updateUpload(upload.key, { status: "uploading" });
      const path = listingImagePath(userId, listing.id);
      await uploadWithProgress(path, prepared.blob, (progress) => updateUpload(upload.key, { progress }));
      const result = await registerImage(listing.id, {
        storagePath: path,
        width: prepared.width,
        height: prepared.height,
      });
      if (!result.ok) {
        setMessages((current) => [...current, listingErrorMessage(result.error)]);
        updateUpload(upload.key, { status: "failed" });
        return;
      }
      setImages((current) => [...current, result.data]);
      finishUpload(upload.key);
    } catch {
      updateUpload(upload.key, { status: "failed" });
    }
  };

  const runQueue = async (queue: PendingUpload[]) => {
    const pending = [...queue];
    const worker = async () => {
      for (let next = pending.shift(); next; next = pending.shift()) {
        await uploadOne(next);
      }
    };
    await Promise.all(Array.from({ length: Math.min(uploadConcurrency, pending.length) }, worker));
  };

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const rejected = files.filter((file) => !isAcceptedImage(file));
    const accepted = files.filter(isAcceptedImage);
    const freeSlots = Math.max(0, maxListingImages - images.length - activeUploads.length);
    const nextMessages = rejected.map((file) => text.invalidType(file.name));
    if (accepted.length > freeSlots) {
      nextMessages.push(text.tooMany(maxListingImages));
    }
    setMessages(nextMessages);

    const queue = accepted.slice(0, freeSlots).map<PendingUpload>((file) => ({
      key: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "compressing",
      progress: 0,
    }));
    if (queue.length > 0) {
      setUploads((current) => [...current, ...queue]);
      void runQueue(queue);
    }
  };

  const retry = (upload: PendingUpload) => {
    updateUpload(upload.key, { status: "compressing", progress: 0 });
    void runQueue([upload]);
  };

  const dismissFailed = (key: string) => finishUpload(key);

  const persistOrder = async (ordered: ListingImage[]) => {
    const previous = images;
    setImages(ordered);
    const result = await reorderImages(
      listing.id,
      ordered.map((image) => image.id),
    );
    if (!result.ok) {
      setImages(previous);
      setMessages([listingErrorMessage(result.error)]);
    }
  };

  const move = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= images.length) {
      return;
    }
    void persistOrder(moveItem(images, index, target));
  };

  const remove = async (imageId: string) => {
    const previous = images;
    setImages((current) => current.filter((image) => image.id !== imageId));
    const result = await deleteImage(listing.id, imageId);
    if (result.ok) {
      setImages(result.data);
    } else {
      setImages(previous);
      setMessages([listingErrorMessage(result.error)]);
    }
  };

  const onTileDragStart = (imageId: string) => {
    orderBeforeDrag.current = images.map((image) => image.id);
    setDraggingId(imageId);
  };

  const onTileDragOver = (event: DragEvent<HTMLLIElement>, overId: string) => {
    if (!draggingId) {
      return;
    }
    event.preventDefault();
    if (overId === draggingId) {
      return;
    }
    setImages((current) => {
      const from = current.findIndex((image) => image.id === draggingId);
      const to = current.findIndex((image) => image.id === overId);
      return from === -1 || to === -1 ? current : moveItem(current, from, to);
    });
  };

  const onTileDragEnd = () => {
    setDraggingId(null);
    const changed = images.some((image, index) => image.id !== orderBeforeDrag.current[index]);
    if (changed) {
      void persistOrder(images);
    }
  };

  const onDropFiles = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  };

  const canContinue = images.length > 0 && activeUploads.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropFiles}
        className={cn(
          "flex flex-col items-center gap-3 border border-dashed p-8 text-center transition-colors",
          dragOver ? "border-crijep bg-papir-2" : "border-tinta-2",
        )}
      >
        <ImagePlus aria-hidden="true" size={28} strokeWidth={1.5} className="text-tinta-2" />
        <p className="font-medium">{text.dropzone}</p>
        <p className="text-small text-tinta-2">{text.or}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            {text.choose}
          </Button>
          <Button variant="secondary" className="md:hidden" onClick={() => cameraInputRef.current?.click()}>
            <Camera aria-hidden="true" size={18} strokeWidth={1.5} />
            {text.camera}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
        <p className="text-small text-tinta-2">{text.helper(maxListingImages)}</p>
      </div>

      {messages.length > 0 ? (
        <FormAlert tone="error">
          {messages.map((message) => (
            <span key={message} className="block">
              {message}
            </span>
          ))}
        </FormAlert>
      ) : null}

      <div className="flex items-baseline justify-between">
        <p className="font-mono text-mono text-tinta-2" aria-live="polite">
          {text.count(images.length, maxListingImages)}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-px border bg-linija sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li
            key={image.id}
            draggable
            onDragStart={() => onTileDragStart(image.id)}
            onDragOver={(event) => onTileDragOver(event, image.id)}
            onDragEnd={onTileDragEnd}
            className={cn("flex flex-col bg-papir", draggingId === image.id && "opacity-40")}
          >
            <div className="relative aspect-4/3 cursor-grab overflow-hidden active:cursor-grabbing">
              <Image
                src={image.publicUrl}
                alt={text.photoAlt(index + 1)}
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
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`${text.moveEarlier}: ${text.photoAlt(index + 1)}`}
                  title={text.moveEarlier}
                  className="inline-flex size-8 items-center justify-center rounded-xs text-tinta-2 hover:bg-papir-2 hover:text-tinta disabled:opacity-30"
                >
                  <ArrowLeft {...iconProps} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label={`${text.moveLater}: ${text.photoAlt(index + 1)}`}
                  title={text.moveLater}
                  className="inline-flex size-8 items-center justify-center rounded-xs text-tinta-2 hover:bg-papir-2 hover:text-tinta disabled:opacity-30"
                >
                  <ArrowRight {...iconProps} />
                </button>
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => move(index, -index)}
                    aria-label={`${text.setCover}: ${text.photoAlt(index + 1)}`}
                    title={text.setCover}
                    className="inline-flex size-8 items-center justify-center rounded-xs text-tinta-2 hover:bg-papir-2 hover:text-tinta"
                  >
                    <Star {...iconProps} />
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void remove(image.id)}
                aria-label={`${text.remove}: ${text.photoAlt(index + 1)}`}
                title={text.remove}
                className="inline-flex size-8 items-center justify-center rounded-xs text-greska hover:bg-papir-2"
              >
                <Trash2 {...iconProps} />
              </button>
            </div>
          </li>
        ))}
        {uploads.map((upload) => (
          <li key={upload.key} className="flex flex-col bg-papir">
            <div className="relative aspect-4/3 overflow-hidden">
              <Image src={upload.previewUrl} alt="" fill unoptimized className="object-cover opacity-50" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-papir p-2">
                <span className={cn("font-mono text-label", upload.status === "failed" ? "text-greska" : "text-tinta-2")}>
                  {upload.status === "compressing"
                    ? text.compressing
                    : upload.status === "uploading"
                      ? `${text.uploading} ${Math.round(upload.progress * 100)}%`
                      : text.failed}
                </span>
                <span className="block h-1 w-full bg-papir-3" aria-hidden="true">
                  <span
                    className={cn("block h-full", upload.status === "failed" ? "bg-greska" : "bg-crijep")}
                    style={{ width: `${Math.round(upload.progress * 100)}%` }}
                  />
                </span>
              </div>
            </div>
            {upload.status === "failed" ? (
              <div className="flex items-center justify-between border-t px-1 py-1">
                <button
                  type="button"
                  onClick={() => retry(upload)}
                  className="inline-flex h-8 items-center gap-1 rounded-xs px-2 text-small hover:bg-papir-2"
                >
                  <RotateCcw {...iconProps} />
                  {text.retry}
                </button>
                <button
                  type="button"
                  onClick={() => dismissFailed(upload.key)}
                  aria-label={text.remove}
                  className="inline-flex size-8 items-center justify-center rounded-xs text-greska hover:bg-papir-2"
                >
                  <Trash2 {...iconProps} />
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {images.length === 0 && uploads.length === 0 ? (
        <p className="text-small text-tinta-2">{bs.listingForm.validation.photosRequired}</p>
      ) : null}

      <WizardFooter>
        <Button variant="ghost" onClick={() => goToStep(3)}>
          {bs.listingForm.back}
        </Button>
        <Button size="lg" disabled={!canContinue} onClick={() => goToStep(5)}>
          {bs.listingForm.next}
        </Button>
      </WizardFooter>
    </div>
  );
}
