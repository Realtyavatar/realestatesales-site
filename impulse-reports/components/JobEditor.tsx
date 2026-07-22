"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import SaveIndicator from "@/components/SaveIndicator";
import ReportActions from "@/components/ReportActions";
import { statusPillClasses } from "@/components/JobsList";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { formatDate, formatMoney, jobTypeLabel, severityLabel, statusLabel } from "@/lib/format";
import {
  JOB_TYPES,
  type Board,
  type Job,
  type JobStatus,
  type Settings,
  type Variation,
} from "@/lib/types";

const STATUSES: JobStatus[] = ["draft", "in_progress", "complete"];

export default function JobEditor({
  initialJob,
  boards,
  variations,
  photoCounts,
  settings,
}: {
  initialJob: Job;
  boards: Board[];
  variations: Variation[];
  photoCounts: Record<string, number>;
  settings: Settings | null;
}) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [addingBoard, setAddingBoard] = useState(false);
  const [addingVariation, setAddingVariation] = useState(false);

  const status = useAutosave(job, async (j) => {
    const { error } = await supabaseBrowser()
      .from("jobs")
      .update({
        client_name: j.client_name,
        client_phone: j.client_phone,
        client_email: j.client_email,
        site_address: j.site_address,
        job_type: j.job_type,
        job_date: j.job_date,
        notes: j.notes,
        recommendations: j.recommendations,
        status: j.status,
      })
      .eq("id", j.id);
    if (error) throw error;
  });

  function set<K extends keyof Job>(key: K, value: Job[K]) {
    setJob((prev) => ({ ...prev, [key]: value }));
  }

  async function addBoard() {
    setAddingBoard(true);
    const defaultChecklist = (settings?.default_checklist ?? []).map(
      (item, i) => ({ id: `c${i + 1}`, label: item.label, result: null })
    );
    const { data, error } = await supabaseBrowser()
      .from("boards")
      .insert({
        job_id: job.id,
        checklist: defaultChecklist,
        sort_order: boards.length,
      })
      .select("id")
      .single();
    if (error || !data) {
      setAddingBoard(false);
      alert("Couldn't add the board — check your connection and try again.");
      return;
    }
    router.push(`/jobs/${job.id}/boards/${data.id}`);
  }

  async function addVariation() {
    setAddingVariation(true);
    const { data, error } = await supabaseBrowser()
      .from("variations")
      .insert({ job_id: job.id })
      .select("id")
      .single();
    if (error || !data) {
      setAddingVariation(false);
      alert("Couldn't add the variation — check your connection and try again.");
      return;
    }
    router.push(`/jobs/${job.id}/variations/${data.id}`);
  }

  async function deleteJob() {
    if (!confirm("Delete this job and everything in it? This can't be undone.")) return;
    const { error } = await supabaseBrowser().from("jobs").delete().eq("id", job.id);
    if (error) {
      alert("Couldn't delete the job — check your connection and try again.");
      return;
    }
    router.replace("/jobs");
    router.refresh();
  }

  const defectBoards = boards.filter((b) => b.has_defects);

  return (
    <div className="min-h-dvh pb-10">
      <TopBar
        title={job.site_address || "New job"}
        backHref="/jobs"
        right={<SaveIndicator status={status} />}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-3 py-4">
        {/* Status */}
        <section className="card p-4">
          <span className="label">Job status</span>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => set("status", s)}
                className={`rocker px-2 ${
                  job.status === s ? "rocker-on-navy" : "rocker-off"
                }`}
              >
                {statusLabel(s)}
              </button>
            ))}
          </div>
        </section>

        {/* Client & site */}
        <section className="card space-y-4 p-4">
          <h2 className="section-tag">Client &amp; site</h2>
          <div>
            <label className="label" htmlFor="site_address">Site address</label>
            <input
              id="site_address"
              className="field"
              autoComplete="street-address"
              value={job.site_address}
              onChange={(e) => set("site_address", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="client_name">Client name</label>
            <input
              id="client_name"
              className="field"
              value={job.client_name}
              onChange={(e) => set("client_name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="client_phone">Phone</label>
              <input
                id="client_phone"
                type="tel"
                inputMode="tel"
                className="field"
                value={job.client_phone}
                onChange={(e) => set("client_phone", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="client_email">Email</label>
              <input
                id="client_email"
                type="email"
                inputMode="email"
                className="field"
                value={job.client_email}
                onChange={(e) => set("client_email", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="job_type">Job type</label>
              <select
                id="job_type"
                className="field"
                value={job.job_type}
                onChange={(e) => set("job_type", e.target.value)}
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="job_date">Date</label>
              <input
                id="job_date"
                type="date"
                className="field-mono"
                value={job.job_date}
                onChange={(e) => set("job_date", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              rows={4}
              className="field"
              value={job.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </section>

        {/* Boards */}
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-tag">Boards</h2>
            <span className="text-sm text-navy/50">{boards.length}</span>
          </div>
          <ul className="space-y-2">
            {boards.map((board) => (
              <li key={board.id}>
                <Link
                  href={`/jobs/${job.id}/boards/${board.id}`}
                  className="flex min-h-[64px] items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 active:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{board.name || "Unnamed board"}</p>
                    <p className="truncate text-sm text-navy/60">
                      {board.location || "No location"} · {photoCounts[board.id] ?? 0} photo{(photoCounts[board.id] ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  {board.has_defects && (
                    <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      Defect
                    </span>
                  )}
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-navy/30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
          <button onClick={addBoard} disabled={addingBoard} className="btn-outline mt-3 w-full">
            {addingBoard ? "Adding…" : "+ Add board"}
          </button>
        </section>

        {/* Defects register */}
        <section className="card p-4">
          <h2 className="section-tag mb-3">Defects register</h2>
          {defectBoards.length === 0 ? (
            <p className="text-navy/50">No defects recorded. Boards marked “Defects found” appear here automatically.</p>
          ) : (
            <ul className="space-y-2">
              {defectBoards.map((board) => (
                <li key={board.id}>
                  <Link
                    href={`/jobs/${job.id}/boards/${board.id}`}
                    className="block rounded-xl border border-red-200 bg-red-50 px-4 py-3 active:bg-red-100"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold">{board.name || "Unnamed board"}</p>
                      <span className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                        {severityLabel(board.defect_severity)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-navy/70">
                      {board.defect_description || "No description yet."}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recommendations */}
        <section className="card p-4">
          <h2 className="section-tag mb-2">Recommendations</h2>
          <p className="mb-2 text-sm text-navy/50">Appears as the final section of the PDF report.</p>
          <textarea
            rows={4}
            className="field"
            value={job.recommendations}
            onChange={(e) => set("recommendations", e.target.value)}
          />
        </section>

        {/* Variations */}
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-tag">Variations</h2>
            <span className="text-sm text-navy/50">{variations.length}</span>
          </div>
          <ul className="space-y-2">
            {variations.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/jobs/${job.id}/variations/${v.id}`}
                  className="flex min-h-[64px] items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 active:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{v.description || "New variation"}</p>
                    <p className="text-sm text-navy/60">
                      {v.pricing_mode === "hourly"
                        ? `${formatMoney(v.hourly_rate_ex_gst)}/hr ex GST`
                        : `${formatMoney(v.price_ex_gst)} ex GST`}{" "}
                      · {formatDate(v.variation_date)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      v.signed_at ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {v.signed_at ? "Signed" : "Unsigned"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <button onClick={addVariation} disabled={addingVariation} className="btn-outline mt-3 w-full">
            {addingVariation ? "Adding…" : "+ New variation"}
          </button>
        </section>

        {/* Report */}
        <ReportActions job={job} />

        <div className="pt-2">
          <span className={`mr-2 ${statusPillClasses(job.status)}`}>
            {statusLabel(job.status)}
          </span>
          <span className="mono text-xs text-navy/40">
            {jobTypeLabel(job.job_type)} · created {formatDate(job.created_at)}
          </span>
        </div>

        <button onClick={deleteJob} className="btn-danger w-full">
          Delete job
        </button>
      </main>
    </div>
  );
}
