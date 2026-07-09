import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_LOGO_BASE64 } from "./default-logo";
import type { Board, Job, Photo, Settings, Variation } from "@/lib/types";
import type { ReportBoard, ReportData, ReportVariation } from "./report";

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

/** Loads everything the PDF needs for a job, or null if the job doesn't exist. */
export async function loadReportData(
  supabase: SupabaseClient,
  jobId: string
): Promise<ReportData | null> {
  const [jobRes, boardsRes, photosRes, variationsRes, settingsRes] =
    await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).maybeSingle(),
      supabase.from("boards").select("*").eq("job_id", jobId).order("sort_order"),
      supabase.from("photos").select("*").eq("job_id", jobId).order("sort_order"),
      supabase.from("variations").select("*").eq("job_id", jobId).order("created_at"),
      supabase.from("settings").select("*").maybeSingle(),
    ]);

  const job = jobRes.data as Job | null;
  if (!job) return null;

  const settings = (settingsRes.data ?? {
    id: true,
    business_name: "Impulse Electrical Contractors",
    rec_number: "REC 25266",
    abn: "",
    phone: "",
    email: "",
    address: "",
    logo_path: null,
    default_checklist: [],
    updated_at: "",
  }) as Settings;

  const photos = (photosRes.data ?? []) as Photo[];
  const boards: ReportBoard[] = await Promise.all(
    ((boardsRes.data ?? []) as Board[]).map(async (board) => {
      const boardPhotos = photos.filter((p) => p.board_id === board.id);
      const reportPhotos = (
        await Promise.all(
          boardPhotos.map(async (photo) => {
            const bytes = await download(supabase, "photos", photo.storage_path);
            return bytes ? { bytes, caption: photo.caption } : null;
          })
        )
      ).filter((p): p is { bytes: Uint8Array; caption: string } => p !== null);
      return { ...board, reportPhotos };
    })
  );

  const variations: ReportVariation[] = await Promise.all(
    ((variationsRes.data ?? []) as Variation[]).map(async (variation) => ({
      ...variation,
      signatureBytes: variation.signature_path
        ? await download(supabase, "signatures", variation.signature_path)
        : null,
    }))
  );

  let logoBytes: Uint8Array | null = settings.logo_path
    ? await download(supabase, "logos", settings.logo_path)
    : null;

  // Fall back to the bundled default logo if no custom one is uploaded
  if (!logoBytes) {
    logoBytes = new Uint8Array(Buffer.from(DEFAULT_LOGO_BASE64, "base64"));
  }

  return { settings, logoBytes, job, boards, variations };
}

export function reportFileName(job: Job): string {
  const slug =
    job.site_address
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "job";
  return `impulse-report-${slug}.pdf`;
}
