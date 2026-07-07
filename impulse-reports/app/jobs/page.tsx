import Link from "next/link";
import TopBar from "@/components/TopBar";
import JobsList from "@/components/JobsList";
import { supabaseServer } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";

export default async function JobsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);

  const jobs = (data ?? []) as Job[];

  return (
    <div className="min-h-dvh pb-28">
      <TopBar
        title="Jobs"
        right={
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-12 w-12 items-center justify-center rounded-xl active:bg-navy-light"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        }
      />
      <main className="mx-auto max-w-3xl px-3 py-4">
        <JobsList jobs={jobs} />
      </main>
    </div>
  );
}
