import imageCompression from "browser-image-compression";
import { assertEncodedAs, imageOutputFormat, type ImageOutputFormat } from "@/lib/images/output-format";

const avatarSize = 256;
const maxAvatarBytes = 512 * 1024;

export type CroppedAvatar = {
  blob: Blob;
  format: ImageOutputFormat;
};

export async function cropToSquare(file: File): Promise<CroppedAvatar> {
  const format = imageOutputFormat();
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = avatarSize;
  canvas.height = avatarSize;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported");
  }
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    avatarSize,
    avatarSize,
  );
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Encoding failed"))), format.mimeType, 0.85),
  );
  assertEncodedAs(blob, format);
  if (blob.size <= maxAvatarBytes) {
    return { blob, format };
  }
  const squareFile = new File([blob], `avatar.${format.extension}`, { type: format.mimeType });
  const compressed = await imageCompression(squareFile, { maxSizeMB: 0.45, fileType: format.mimeType, useWebWorker: true });
  assertEncodedAs(compressed, format);
  return { blob: compressed, format };
}
