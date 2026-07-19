import { supabaseServer } from "@/lib/supabase/server";
import { loadReportData, reportFileName } from "@/lib/pdf/data";
import { buildReportPdf } from "@/lib/pdf/report";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const { inspectionId } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const data = await loadReportData(supabase, inspectionId);
  if (!data) {
    return Response.json({ error: "Inspection not found" }, { status: 404 });
  }

  const pdf = await buildReportPdf(data);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportFileName(data.inspection, data.generatedAt)}"`,
      "Cache-Control": "no-store",
    },
  });
}
