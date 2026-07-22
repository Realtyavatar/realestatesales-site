"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import SaveIndicator from "@/components/SaveIndicator";
import type { ChecklistItem, Room } from "@/lib/types";

export default function RoomChecklist({ room }: { room: Room }) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(room.checklist);

  const status = useAutosave(checklist, async (value) => {
    const { error } = await supabaseBrowser()
      .from("rooms")
      .update({ checklist: value })
      .eq("id", room.id);
    if (error) throw error;
  });

  function toggle(id: string) {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  const checked = checklist.filter((i) => i.checked).length;

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="display text-sm">Checklist</h2>
        <div className="flex items-center gap-3">
          <SaveIndicator status={status} tone="light" />
          {checked === checklist.length && checklist.length > 0 ? (
            <span className="stamp text-[0.6rem]">
              Ready · {checked}/{checklist.length}
            </span>
          ) : (
            <span className="rounded-full bg-paper px-3 py-1 font-mono text-xs font-bold text-ink/60">
              {checked}/{checklist.length}
            </span>
          )}
        </div>
      </div>

      <ul className="divide-y divide-ink/5">
        {checklist.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              className="flex w-full items-center gap-4 py-3.5 text-left active:bg-paper"
            >
              <span
                aria-hidden
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold transition ${
                  item.checked
                    ? "border-brand bg-brand text-white"
                    : "border-ink/25 bg-white text-transparent"
                }`}
              >
                ✓
              </span>
              <span
                className={`text-base ${
                  item.checked ? "text-ink/50 line-through" : "text-ink"
                }`}
              >
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
