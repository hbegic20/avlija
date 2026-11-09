import imageCompression from "browser-image-compression";
import { assertEncodedAs, decodableImage, imageOutputFormat, type ImageOutputFormat } from "@/lib/images/output-format";
import { createClient } from "@/lib/supabase/client";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";
import { listingImagesBucket } from "@/lib/supabase/storage-url";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export type PreparedImage = {
  blob: Blob;
  format: ImageOutputFormat;
  width: number;
  height: number;
};

export async function prepareListingImage(file: File): Promise<PreparedImage> {
  const source = await decodableImage(file);
  const format = imageOutputFormat();
  const compressed = await imageCompression(source, {
    maxWidthOrHeight: 1920,
    maxSizeMB: 1.8,
    initialQuality: 0.8,
    fileType: format.mimeType,
    useWebWorker: true,
  });
  assertEncodedAs(compressed, format);
  const bitmap = await createImageBitmap(compressed);
  const prepared = { blob: compressed, format, width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return prepared;
}

export function listingImagePath(userId: string, listingId: string, format: ImageOutputFormat): string {
  return `${userId}/${listingId}/${crypto.randomUUID()}.${format.extension}`;
}

export async function uploadWithProgress(
  path: string,
  prepared: PreparedImage,
  onProgress: (fraction: number) => void,
): Promise<void> {
  const { data } = await createClient().auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Not signed in");
  }

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${supabaseUrl}/storage/v1/object/${listingImagesBucket}/${path}`);
    request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    request.setRequestHeader("apikey", supabasePublishableKey);
    request.setRequestHeader("Content-Type", prepared.format.mimeType);
    request.setRequestHeader("x-upsert", "false");
    request.setRequestHeader("cache-control", "max-age=31536000");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${request.status}`));
      }
    });
    request.addEventListener("error", () => reject(new Error("Network error")));
    request.send(prepared.blob);
  });
}

export function isAcceptedImage(file: File): boolean {
  return acceptedImageTypes.includes(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}
