import { notFound } from "next/navigation";
import JobEditor from "@/components/JobEditor";
import { supabaseServer } from "@/lib/supabase/server";
import type { Board, Job, Settings, Variation } from "@/lib/types";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const [jobRes, boardsRes, variationsRes, photosRes, settingsRes] =
    await Promise.all([
      supabase.from("jobs").select("*").eq("id", id).maybeSingle(),
      supabase.from("boards").select("*").eq("job_id", id).order("sort_order"),
      supabase
        .from("variations")
        .select("*")
        .eq("job_id", id)
        .order("created_at"),
      supabase.from("photos").select("id, board_id").eq("job_id", id),
      supabase.from("settings").select("*").maybeSingle(),
    ]);

  const job = jobRes.data as Job | null;
  if (!job) notFound();

  const photoCounts: Record<string, number> = {};
  for (const p of photosRes.data ?? []) {
    photoCounts[p.board_id] = (photoCounts[p.board_id] ?? 0) + 1;
  }

  return (
    <JobEditor
      initialJob={job}
      boards={(boardsRes.data ?? []) as Board[]}
      variations={(variationsRes.data ?? []) as Variation[]}
      photoCounts={photoCounts}
      settings={settingsRes.data as Settings | null}
    />
  );
}
