"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDate, jobTypeLabel, statusLabel } from "@/lib/format";
import type { Job, JobStatus } from "@/lib/types";

const STATUS_FILTERS: { value: JobStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
];

export function statusPillClasses(status: JobStatus): string {
  switch (status) {
    case "draft":
      return "tag-pill bg-gray-200 text-gray-700";
    case "in_progress":
      return "tag-pill bg-brand/15 text-brand-dark";
    case "complete":
      return "tag-pill bg-emerald-100 text-emerald-800";
  }
}

export default function JobsList({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (!q) return true;
      return (
        job.site_address.toLowerCase().includes(q) ||
        job.client_name.toLowerCase().includes(q)
      );
    });
  }, [jobs, query, statusFilter]);

  async function createJob() {
    setCreating(true);
    const { data, error } = await supabaseBrowser()
      .from("jobs")
      .insert({})
      .select("id")
      .single();
    if (error || !data) {
      setCreating(false);
      alert("Couldn't create the job — check your connection and try again.");
      return;
    }
    router.push(`/jobs/${data.id}`);
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        inputMode="search"
        placeholder="Search address or client…"
        className="field"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            style={{ fontFamily: "var(--font-display)" }}
            className={`min-h-[44px] shrink-0 rounded-md px-4 text-sm font-bold uppercase tracking-[0.06em] transition ${
              statusFilter === f.value
                ? "bg-navy text-white"
                : "border border-line bg-white text-navy/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((job) => (
          <li key={job.id}>
            <Link href={`/jobs/${job.id}`} className="card block p-4 active:bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-lg font-bold leading-snug">
                  {job.site_address || "No address yet"}
                </p>
                <span className={`shrink-0 ${statusPillClasses(job.status)}`}>
                  {statusLabel(job.status)}
                </span>
              </div>
              <p className="mt-1 text-navy/70">
                {job.client_name || "No client yet"}
              </p>
              <p className="mono mt-1 text-[12.5px] text-navy/50">
                {jobTypeLabel(job.job_type)} · {formatDate(job.job_date)}
              </p>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="card p-8 text-center text-navy/50">
            {jobs.length === 0
              ? "No jobs yet — tap “New Job” to get started."
              : "No jobs match your search."}
          </li>
        )}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent px-4 pb-5 pt-8">
        <div className="mx-auto max-w-3xl">
          <button onClick={createJob} disabled={creating} className="btn-primary w-full text-lg shadow-lg">
            {creating ? "Creating…" : "+ New Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
