import { supabaseServer } from "@/lib/supabase/server";
import { loadReportData, reportFileName } from "@/lib/pdf/data";
import { buildReportPdf } from "@/lib/pdf/report";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const data = await loadReportData(supabase, jobId);
  if (!data) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  // Debug: log checklist state for each board
  for (const board of data.boards) {
    console.log(`[report] board=${board.name} checklist=${JSON.stringify(board.checklist)}`);
  }

  const pdf = await buildReportPdf(data);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${reportFileName(data.job)}"`,
      "Cache-Control": "no-store",
    },
  });
}
