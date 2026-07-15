"use client";

// Client-side photo compression: downscale to a phone-friendly size and
// re-encode as JPEG before anything touches the network. Keeps uploads fast
// on slow mobile data and storage costs down.

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

export async function compressImage(file: File | Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    // from-image applies EXIF orientation so phone photos aren't sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Not decodable (or an odd format) — upload as-is rather than losing it.
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  return blob ?? file;
}
