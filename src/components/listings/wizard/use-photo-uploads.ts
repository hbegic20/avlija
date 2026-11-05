"use client";

import { useEffect, useRef, useState } from "react";
import { registerImage } from "@/actions/listings";
import { listingErrorMessage } from "@/lib/listings/listing-errors";
import type { ListingImage } from "@/lib/listings/types";
import { listingImagePath, prepareListingImage, uploadWithProgress } from "@/lib/listings/upload-listing-image";

const uploadConcurrency = 3;

export type UploadStatus = "compressing" | "uploading" | "failed";

export type PendingUpload = {
  key: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
};

type PhotoUploadOptions = {
  listingId: string;
  userId: string;
  onUploaded: (image: ListingImage) => void;
  onError: (message: string) => void;
};

export function usePhotoUploads({ listingId, userId, onUploaded, onError }: PhotoUploadOptions) {
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
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

  const updateUpload = (key: string, patch: Partial<PendingUpload>) =>
    setUploads((current) => current.map((upload) => (upload.key === key ? { ...upload, ...patch } : upload)));

  const removeUpload = (key: string) =>
    setUploads((current) => {
      const removed = current.find((upload) => upload.key === key);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return current.filter((upload) => upload.key !== key);
    });

  const uploadOne = async (upload: PendingUpload) => {
    try {
      updateUpload(upload.key, { status: "compressing", progress: 0 });
      const prepared = await prepareListingImage(upload.file);
      updateUpload(upload.key, { status: "uploading" });
      const path = listingImagePath(userId, listingId);
      await uploadWithProgress(path, prepared.blob, (progress) => updateUpload(upload.key, { progress }));
      const result = await registerImage(listingId, { storagePath: path, width: prepared.width, height: prepared.height });
      if (!result.ok) {
        onError(listingErrorMessage(result.error));
        updateUpload(upload.key, { status: "failed" });
        return;
      }
      onUploaded(result.data);
      removeUpload(upload.key);
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

  const enqueue = (files: File[]) => {
    const queue = files.map<PendingUpload>((file) => ({
      key: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "compressing",
      progress: 0,
    }));
    if (queue.length === 0) {
      return;
    }
    setUploads((current) => [...current, ...queue]);
    void runQueue(queue);
  };

  const retry = (upload: PendingUpload) => {
    updateUpload(upload.key, { status: "compressing", progress: 0 });
    void runQueue([upload]);
  };

  const activeCount = uploads.filter((upload) => upload.status !== "failed").length;

  return { uploads, activeCount, enqueue, retry, dismiss: removeUpload };
}
