"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import SaveIndicator from "@/components/SaveIndicator";
import PhotoSection from "@/components/PhotoSection";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import {
  SEVERITIES,
  type Board,
  type ChecklistItem,
  type ChecklistResult,
  type Photo,
} from "@/lib/types";

const RESULTS: { value: ChecklistResult; label: string; activeCls: string }[] = [
  { value: "pass", label: "Pass", activeCls: "bg-emerald-600 text-white" },
  { value: "fail", label: "Fail", activeCls: "bg-red-600 text-white" },
  { value: "na", label: "N/A", activeCls: "bg-gray-500 text-white" },
];

export default function BoardEditor({
  initialBoard,
  initialPhotos,
}: {
  initialBoard: Board;
  initialPhotos: Photo[];
}) {
  const router = useRouter();
  const [board, setBoard] = useState({ ...initialBoard, earth_location: initialBoard.earth_location ?? "" });
  const [newItemLabel, setNewItemLabel] = useState("");

  const status = useAutosave(board, async (b) => {
    const { error } = await supabaseBrowser()
      .from("boards")
      .update({
        name: b.name,
        location: b.location,
        rating_amps: b.rating_amps,
        fault_level: b.fault_level,
        earth_location: b.earth_location,
        checklist: b.checklist,
        has_defects: b.has_defects,
        defect_description: b.defect_description,
        defect_severity: b.defect_severity,
      })
      .eq("id", b.id);
    if (error) throw error;
  });

  function set<K extends keyof Board>(key: K, value: Board[K]) {
    setBoard((prev) => ({ ...prev, [key]: value }));
  }

  function setResult(itemId: string, result: ChecklistResult) {
    set(
      "checklist",
      board.checklist.map((item) =>
        item.id === itemId
          ? { ...item, result: item.result === result ? null : result }
          : item
      )
    );
  }

  function removeItem(itemId: string) {
    set("checklist", board.checklist.filter((item) => item.id !== itemId));
  }

  function addItem() {
    const label = newItemLabel.trim();
    if (!label) return;
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      label,
      result: null,
    };
    set("checklist", [...board.checklist, item]);
    setNewItemLabel("");
  }

  async function deleteBoard() {
    if (!confirm("Delete this board and its photos? This can't be undone.")) return;
    const { error } = await supabaseBrowser().from("boards").delete().eq("id", board.id);
    if (error) {
      alert("Couldn't delete the board — check your connection and try again.");
      return;
    }
    router.replace(`/jobs/${board.job_id}`);
    router.refresh();
  }

  return (
    <div className="min-h-dvh pb-10">
      <TopBar
        title={board.name || "Board"}
        backHref={`/jobs/${board.job_id}`}
        right={<SaveIndicator status={status} />}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-3 py-4">
        {/* Details */}
        <section className="card space-y-4 p-4">
          <h2 className="text-lg font-bold">Board details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="board_name">Board name / ID</label>
              <input
                id="board_name"
                className="field"
                placeholder="e.g. MSB, GMB-1, Unit 14"
                value={board.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="board_location">Location on site</label>
              <input
                id="board_location"
                className="field"
                placeholder="e.g. Ground floor switch room"
                value={board.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="earth_location">Main earth location</label>
            <input
              id="earth_location"
              className="field"
              placeholder="e.g. Water meter, earth stake at meter box"
              value={board.earth_location}
              onChange={(e) => set("earth_location", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="rating_amps">Rating (A)</label>
              <input
                id="rating_amps"
                inputMode="numeric"
                className="field"
                placeholder="e.g. 250"
                value={board.rating_amps}
                onChange={(e) => set("rating_amps", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="fault_level">Fault level</label>
              <input
                id="fault_level"
                className="field"
                placeholder="e.g. 10kA"
                value={board.fault_level}
                onChange={(e) => set("fault_level", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Checklist */}
        <section className="card p-4">
          <h2 className="mb-3 text-lg font-bold">Checklist</h2>
          <ul className="space-y-3">
            {board.checklist.map((item) => (
              <li key={item.id} className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-semibold">{item.label}</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.label}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-navy/40 active:bg-gray-100"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {RESULTS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setResult(item.id, r.value)}
                      className={`min-h-[48px] rounded-xl text-sm font-bold transition ${
                        item.result === r.value
                          ? r.activeCls
                          : "bg-gray-100 text-navy/60 active:bg-gray-200"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
            {board.checklist.length === 0 && (
              <li className="py-4 text-center text-navy/50">No checklist items — add one below.</li>
            )}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              className="field flex-1"
              placeholder="Add checklist item…"
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <button onClick={addItem} className="btn-outline w-20 shrink-0">
              Add
            </button>
          </div>
        </section>

        {/* Defects */}
        <section className="card space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Defects found?</h2>
            <button
              role="switch"
              aria-checked={board.has_defects}
              onClick={() => set("has_defects", !board.has_defects)}
              className={`relative h-10 w-20 rounded-full transition ${
                board.has_defects ? "bg-red-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow transition-all ${
                  board.has_defects ? "left-11" : "left-1"
                }`}
              />
              <span className="sr-only">Defects found</span>
            </button>
          </div>

          {board.has_defects && (
            <>
              <div>
                <span className="label">Severity</span>
                <div className="grid grid-cols-3 gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => set("defect_severity", s.value)}
                      className={`min-h-[52px] rounded-xl px-1 text-xs font-bold leading-tight transition sm:text-sm ${
                        board.defect_severity === s.value
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-navy/60 active:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="defect_description">Defect description</label>
                <textarea
                  id="defect_description"
                  rows={3}
                  className="field"
                  placeholder="What's wrong, where, and what's needed to fix it"
                  value={board.defect_description}
                  onChange={(e) => set("defect_description", e.target.value)}
                />
              </div>
            </>
          )}
        </section>

        {/* Photos */}
        <PhotoSection
          jobId={board.job_id}
          boardId={board.id}
          initialPhotos={initialPhotos}
        />

        <button onClick={deleteBoard} className="btn-danger w-full">
          Delete board
        </button>
      </main>
    </div>
  );
}
