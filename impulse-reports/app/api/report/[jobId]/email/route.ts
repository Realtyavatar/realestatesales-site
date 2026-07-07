import { supabaseServer } from "@/lib/supabase/server";
import { loadReportData, reportFileName } from "@/lib/pdf/data";
import { buildReportPdf } from "@/lib/pdf/report";
import { formatDate, jobTypeLabel } from "@/lib/format";

export async function POST(
  request: Request,
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

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REPORT_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return Response.json(
      {
        error:
          "Email isn't configured yet — set RESEND_API_KEY and REPORT_FROM_EMAIL in Vercel (see README).",
      },
      { status: 501 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const data = await loadReportData(supabase, jobId);
  if (!data) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const pdf = await buildReportPdf(data);
  const { job, settings } = data;

  const subject = `${jobTypeLabel(job.job_type)} report — ${job.site_address || "your property"}`;
  const text = [
    `Hi ${job.client_name || "there"},`,
    "",
    `Please find attached the ${jobTypeLabel(job.job_type).toLowerCase()} report for ${job.site_address || "your property"} (${formatDate(job.job_date)}).`,
    "",
    "If you have any questions, just reply to this email.",
    "",
    `${settings.business_name}`,
    `${settings.rec_number}`,
    settings.phone,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${settings.business_name} <${fromEmail}>`,
      to: [to],
      reply_to: settings.email || undefined,
      subject,
      text,
      attachments: [
        {
          filename: reportFileName(job),
          content: Buffer.from(pdf).toString("base64"),
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend error:", res.status, detail);
    return Response.json(
      { error: "The email service rejected the message — try again shortly." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
