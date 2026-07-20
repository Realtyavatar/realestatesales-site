import type { SupabaseClient } from "@supabase/supabase-js";
import type { DamageFlag, Inspection, Photo, Room } from "@/lib/types";
import type { ReportData, ReportRoom } from "./report";

async function download(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    // The PDF renders a placeholder for missing images; log so a systematic
    // storage problem is visible in Vercel logs rather than silent.
    console.warn(`report: could not download ${bucket}/${path}:`, error?.message);
    return null;
  }
  return new Uint8Array(await data.arrayBuffer());
}

/** Loads everything the PDF needs, or null if the inspection doesn't exist. */
export async function loadReportData(
  supabase: SupabaseClient,
  inspectionId: string
): Promise<ReportData | null> {
  const [inspectionRes, roomsRes, photosRes, flagsRes] = await Promise.all([
    supabase.from("inspections").select("*").eq("id", inspectionId).maybeSingle(),
    supabase
      .from("rooms")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("sort_order"),
    supabase
      .from("photos")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("sort_order"),
    supabase
      .from("damage_flags")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at"),
  ]);

  const inspection = inspectionRes.data as Inspection | null;
  if (!inspection) return null;

  const photos = (photosRes.data ?? []) as Photo[];
  const flags = (flagsRes.data ?? []) as DamageFlag[];

  const rooms: ReportRoom[] = await Promise.all(
    ((roomsRes.data ?? []) as Room[]).map(async (room) => {
      const roomPhotos = photos.filter((p) => p.room_id === room.id);
      const reportPhotos = (
        await Promise.all(
          roomPhotos.map(async (photo) => {
            const bytes = await download(supabase, "photos", photo.storage_path);
            return bytes
              ? { bytes, caption: photo.caption, takenAt: photo.taken_at }
              : null;
          })
        )
      ).filter(
        (p): p is { bytes: Uint8Array; caption: string; takenAt: string } =>
          p !== null
      );
      return {
        ...room,
        reportPhotos,
        damageFlags: flags.filter((f) => f.room_id === room.id),
      };
    })
  );

  return {
    inspection,
    rooms,
    generalFlags: flags.filter((f) => f.room_id === null),
    generatedAt: new Date(),
  };
}

/** Timestamped file name, e.g. inspection-beach-house-20260719-1432.pdf */
export function reportFileName(inspection: Inspection, generatedAt: Date): string {
  const slug =
    (inspection.property_name || inspection.property_address)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "inspection";
  // Melbourne time, to match the timestamps shown inside the report (the
  // server clock is UTC on Vercel).
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Melbourne",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(generatedAt)
      .map((p) => [p.type, p.value])
  );
  const stamp = `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}`;
  return `inspection-${slug}-${stamp}.pdf`;
}
