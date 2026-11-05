"use client";

import { useRef, useState, type DragEvent, type Ref } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { deleteImage, reorderImages } from "@/actions/listings";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { maxListingImages } from "@/lib/domain/listing-fields";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import { listingErrorMessage } from "@/lib/listings/listing-errors";
import type { ListingImage } from "@/lib/listings/types";
import { isAcceptedImage } from "@/lib/listings/upload-listing-image";
import { PhotoTile, UploadTile } from "./photo-tiles";
import { useReportDirty } from "./use-dirty-state";
import { usePhotoUploads } from "./use-photo-uploads";
import { useWizard } from "./wizard-context";
import { WizardFooter } from "./wizard-footer";

const text = bs.listingForm.photos;

function moveItem<Item>(items: Item[], from: number, to: number): Item[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function HiddenImageInput({
  ref,
  multiple,
  capture,
  onFiles,
}: {
  ref: Ref<HTMLInputElement>;
  multiple?: boolean;
  capture?: "environment";
  onFiles: (files: FileList) => void;
}) {
  return (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      multiple={multiple}
      capture={capture}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        if (event.target.files) {
          onFiles(event.target.files);
        }
        event.target.value = "";
      }}
    />
  );
}

export function StepPhotos() {
  const { listing } = useWizard();
  return listing ? <PhotoManager listingId={listing.id} /> : null;
}

function PhotoManager({ listingId }: { listingId: string }) {
  const { images: initialImages, userId, goToStep } = useWizard();
  const [images, setImages] = useState<ListingImage[]>(initialImages);
  const [messages, setMessages] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const orderBeforeDrag = useRef<string[]>([]);

  const { uploads, activeCount, enqueue, retry, dismiss } = usePhotoUploads({
    listingId,
    userId,
    onUploaded: (image) => setImages((current) => [...current, image]),
    onError: (message) => setMessages((current) => [...current, message]),
  });
  useReportDirty(activeCount > 0);

  const addFiles = (fileList: FileList) => {
    const files = Array.from(fileList);
    const accepted = files.filter(isAcceptedImage);
    const freeSlots = Math.max(0, maxListingImages - images.length - activeCount);
    const nextMessages = files.filter((file) => !isAcceptedImage(file)).map((file) => text.invalidType(file.name));
    if (accepted.length > freeSlots) {
      nextMessages.push(text.tooMany(maxListingImages));
    }
    setMessages(nextMessages);
    enqueue(accepted.slice(0, freeSlots));
  };

  const persistOrder = async (ordered: ListingImage[]) => {
    const previous = images;
    setImages(ordered);
    const result = await reorderImages(
      listingId,
      ordered.map((image) => image.id),
    );
    if (!result.ok) {
      setImages(previous);
      setMessages([listingErrorMessage(result.error)]);
    }
  };

  const move = (index: number, offset: number) => {
    const target = index + offset;
    if (target >= 0 && target < images.length) {
      void persistOrder(moveItem(images, index, target));
    }
  };

  const remove = async (imageId: string) => {
    const previous = images;
    setImages((current) => current.filter((image) => image.id !== imageId));
    const result = await deleteImage(listingId, imageId);
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
    if (images.some((image, index) => image.id !== orderBeforeDrag.current[index])) {
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

  const canContinue = images.length > 0 && activeCount === 0;

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
        <HiddenImageInput ref={fileInputRef} multiple onFiles={addFiles} />
        <HiddenImageInput ref={cameraInputRef} capture="environment" onFiles={addFiles} />
        <p className="text-small text-tinta-2">{text.helper(maxListingImages)}</p>
      </div>

      {messages.length > 0 ? (
        <FormAlert tone="error">
          {messages.map((message, index) => (
            <span key={`${index}-${message}`} className="block">
              {message}
            </span>
          ))}
        </FormAlert>
      ) : null}

      <p className="font-mono text-mono text-tinta-2" aria-live="polite">
        {text.count(images.length, maxListingImages)}
      </p>

      <ul className="grid grid-cols-2 gap-px border bg-linija sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <PhotoTile
            key={image.id}
            image={image}
            index={index}
            isLast={index === images.length - 1}
            dragging={draggingId === image.id}
            onMove={(offset) => move(index, offset)}
            onRemove={() => void remove(image.id)}
            onDragStart={() => onTileDragStart(image.id)}
            onDragOver={(event) => onTileDragOver(event, image.id)}
            onDragEnd={onTileDragEnd}
          />
        ))}
        {uploads.map((upload) => (
          <UploadTile
            key={upload.key}
            upload={upload}
            onRetry={() => retry(upload)}
            onDismiss={() => dismiss(upload.key)}
          />
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
