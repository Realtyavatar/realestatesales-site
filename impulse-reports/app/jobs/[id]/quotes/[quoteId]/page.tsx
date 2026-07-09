import { notFound } from "next/navigation";
import QuoteEditor from "@/components/QuoteEditor";
import { supabaseServer } from "@/lib/supabase/server";
import type { Job, Quote, Settings } from "@/lib/types";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  const { id, quoteId } = await params;
  const supabase = await supabaseServer();

  const [quoteRes, jobRes, settingsRes] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", quoteId).eq("job_id", id).maybeSingle(),
    supabase.from("jobs").select("*").eq("id", id).maybeSingle(),
    supabase.from("settings").select("*").maybeSingle(),
  ]);

  const quote = quoteRes.data as Quote | null;
  const job = jobRes.data as Job | null;
  if (!quote || !job) notFound();

  return (
    <QuoteEditor
      initialQuote={quote}
      job={job}
      settings={settingsRes.data as Settings | null}
    />
  );
}
