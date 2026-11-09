export type ImageOutputFormat = {
  mimeType: "image/webp" | "image/jpeg";
  extension: "webp" | "jpg";
};

const webpFormat: ImageOutputFormat = { mimeType: "image/webp", extension: "webp" };
const jpegFormat: ImageOutputFormat = { mimeType: "image/jpeg", extension: "jpg" };

let detectedFormat: ImageOutputFormat | null = null;

function canEncodeWebp(): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL(webpFormat.mimeType).startsWith(`data:${webpFormat.mimeType}`);
}

export function imageOutputFormat(): ImageOutputFormat {
  detectedFormat ??= canEncodeWebp() ? webpFormat : jpegFormat;
  return detectedFormat;
}

export type ImagePreparationFailure = "unsupported_source" | "encoding";

export class ImagePreparationError extends Error {
  constructor(readonly reason: ImagePreparationFailure) {
    super(`Image preparation failed: ${reason}`);
  }
}

export function assertEncodedAs(blob: Blob, format: ImageOutputFormat): void {
  if (blob.type !== format.mimeType) {
    throw new ImagePreparationError("encoding");
  }
}

const extensionTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

function fileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function withImageType(file: File): File {
  const inferredType = extensionTypes[fileExtension(file)];
  return file.type || !inferredType ? file : new File([file], file.name, { type: inferredType, lastModified: file.lastModified });
}

function isHeic(file: File): boolean {
  return file.type === "image/heic" || file.type === "image/heif";
}

async function browserCanDecode(file: File): Promise<boolean> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function decodableImage(file: File): Promise<File> {
  const typed = withImageType(file);
  if (isHeic(typed) && !(await browserCanDecode(typed))) {
    throw new ImagePreparationError("unsupported_source");
  }
  return typed;
}
