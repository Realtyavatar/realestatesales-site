import { supabaseServer } from "@/lib/supabase/server";
import { buildQuotePdf, quoteFileName } from "@/lib/pdf/quote";
import type { Job, Quote, Settings } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const { quoteId } = await params;
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const [quoteRes, settingsRes] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle(),
    supabase.from("settings").select("*").maybeSingle(),
  ]);

  const quote = quoteRes.data as Quote | null;
  if (!quote) return Response.json({ error: "Quote not found" }, { status: 404 });

  const jobRes = await supabase.from("jobs").select("*").eq("id", quote.job_id).maybeSingle();
  const job = jobRes.data as Job | null;
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
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
    updated_at: new Date().toISOString(),
  }) as Settings;

  const pdf = await buildQuotePdf(quote, job, settings);
  const filename = quoteFileName(quote, job);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
