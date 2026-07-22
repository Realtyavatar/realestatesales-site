"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import SaveIndicator from "@/components/SaveIndicator";
import type { Inspection } from "@/lib/types";

export default function NotesSection({ inspection }: { inspection: Inspection }) {
  const [notes, setNotes] = useState(inspection.notes);

  const status = useAutosave(notes, async (value) => {
    const { error } = await supabaseBrowser()
      .from("inspections")
      .update({ notes: value })
      .eq("id", inspection.id);
    if (error) throw error;
  });

  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="display text-sm">Overall notes</h2>
        <SaveIndicator status={status} tone="light" />
      </div>
      <textarea
        className="field min-h-32"
        placeholder="Anything worth recording about this checkout — condition, missing items, follow-ups…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </section>
  );
}
