"use client";

import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { SEVERITIES, type DamageFlag, type DamageSeverity } from "@/lib/types";

const SEVERITY_STYLES: Record<DamageSeverity, string> = {
  minor: "bg-amber-100 text-amber-800",
  moderate: "bg-orange-100 text-orange-800",
  severe: "bg-red-100 text-red-800",
};

// Damage flagging: each flag has a description, a severity (minor / moderate /
// severe) and notes. Used on the inspection overview (with a room picker,
// including "whole property") and on a room page (fixedRoomId).
export default function DamageFlags({
  inspectionId,
  rooms,
  fixedRoomId,
  initialFlags,
}: {
  inspectionId: string;
  rooms: { id: string; name: string }[];
  fixedRoomId?: string;
  initialFlags: DamageFlag[];
}) {
  const [flags, setFlags] = useState(initialFlags);
  const [newRoomId, setNewRoomId] = useState<string>(fixedRoomId ?? "");
  const [adding, setAdding] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingPatches = useRef<Record<string, Partial<DamageFlag>>>({});

  async function addFlag() {
    setAdding(true);
    const { data, error } = await supabaseBrowser()
      .from("damage_flags")
      .insert({
        inspection_id: inspectionId,
        room_id: fixedRoomId ?? (newRoomId || null),
        severity: "minor",
      })
      .select()
      .single();
    setAdding(false);
    if (error || !data) {
      alert("Couldn't add the damage flag — check your connection and try again.");
      return;
    }
    setFlags((prev) => [...prev, data as DamageFlag]);
  }

  function updateFlag(id: string, patch: Partial<DamageFlag>) {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    // Merge into the pending patch — edits to different fields within the
    // debounce window must not overwrite each other.
    pendingPatches.current[id] = { ...pendingPatches.current[id], ...patch };
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      const merged = pendingPatches.current[id];
      delete pendingPatches.current[id];
      const { error } = await supabaseBrowser()
        .from("damage_flags")
        .update(merged)
        .eq("id", id);
      if (error) {
        // Put the failed patch back so the next edit retries it too.
        pendingPatches.current[id] = { ...merged, ...pendingPatches.current[id] };
        console.warn("damage flag save failed, will retry on next edit:", error.message);
      }
    }, 800);
  }

  async function deleteFlag(id: string) {
    if (!confirm("Remove this damage flag?")) return;
    const { error } = await supabaseBrowser().from("damage_flags").delete().eq("id", id);
    if (error) {
      alert("Couldn't remove the flag — check your connection and try again.");
      return;
    }
    setFlags((prev) => prev.filter((f) => f.id !== id));
  }

  function roomName(roomId: string | null): string {
    if (!roomId) return "Whole property";
    return rooms.find((r) => r.id === roomId)?.name ?? "Room";
  }

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Damage flags</h2>
        <span className="text-sm text-ink/50">{flags.length}</span>
      </div>

      {flags.length === 0 && (
        <p className="pb-3 text-ink/50">
          No damage flagged{fixedRoomId ? " in this room" : ""}.
        </p>
      )}

      <ul className="space-y-4">
        {flags.map((flag) => (
          <li key={flag.id} className="rounded-xl border border-gray-200 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              {!fixedRoomId && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ink/70">
                  {roomName(flag.room_id)}
                </span>
              )}
              <div className="flex flex-1 justify-end gap-1">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateFlag(flag.id, { severity: s.value })}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      flag.severity === s.value
                        ? SEVERITY_STYLES[s.value] + " ring-2 ring-current"
                        : "bg-gray-100 text-ink/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              className="field mb-2"
              placeholder="What's damaged? e.g. Cracked bathroom mirror"
              value={flag.description}
              onChange={(e) => updateFlag(flag.id, { description: e.target.value })}
            />
            <textarea
              className="field min-h-20"
              placeholder="Notes — how it happened, repair needed, cost estimate…"
              value={flag.notes}
              onChange={(e) => updateFlag(flag.id, { notes: e.target.value })}
            />
            <button
              onClick={() => deleteFlag(flag.id)}
              className="mt-2 text-sm font-semibold text-red-600"
            >
              Remove flag
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-3">
        {!fixedRoomId && (
          <select
            className="field flex-1"
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
            aria-label="Room for new damage flag"
          >
            <option value="">Whole property</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <button onClick={addFlag} disabled={adding} className="btn-danger flex-1">
          ⚑ Flag damage
        </button>
      </div>
    </section>
  );
}
