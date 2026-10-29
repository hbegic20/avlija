import imageCompression from "browser-image-compression";

const avatarSize = 256;
const maxAvatarBytes = 512 * 1024;

export async function cropToSquareWebp(file: File): Promise<Blob> {
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
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Encoding failed"))), "image/webp", 0.85),
  );
  if (blob.size <= maxAvatarBytes) {
    return blob;
  }
  const squareFile = new File([blob], "avatar.webp", { type: "image/webp" });
  return imageCompression(squareFile, { maxSizeMB: 0.45, fileType: "image/webp", useWebWorker: true });
}
