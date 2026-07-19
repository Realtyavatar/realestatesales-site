"use client";

import { photoStamp } from "./format";

// Client-side photo processing: downscale to a phone-friendly size, re-encode
// as JPEG, and burn the capture date/time into the bottom-right corner so
// every photo in the report is self-evidently timestamped (useful as damage
// evidence). The same timestamp is stored on the photo row in the database.

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

export async function processPhoto(
  file: File | Blob,
  takenAt: Date
): Promise<Blob> {
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

  drawTimestamp(ctx, width, height, photoStamp(takenAt));

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  return blob ?? file;
}

function drawTimestamp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stamp: string
) {
  const fontSize = Math.max(14, Math.round(width * 0.026));
  const pad = Math.round(fontSize * 0.5);
  ctx.font = `600 ${fontSize}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = "middle";
  const textW = ctx.measureText(stamp).width;
  const boxW = textW + pad * 2;
  const boxH = fontSize + pad * 2;
  const x = width - boxW - pad;
  const y = height - boxH - pad;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, Math.round(fontSize * 0.35));
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(stamp, x + pad, y + boxH / 2);
}
