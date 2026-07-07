"use client";

import type { SaveStatus } from "@/lib/use-autosave";

export default function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const map: Record<Exclude<SaveStatus, "idle">, { text: string; cls: string }> = {
    pending: { text: "Typing…", cls: "text-white/60" },
    saving: { text: "Saving…", cls: "text-white/80" },
    saved: { text: "✓ Saved", cls: "text-emerald-300" },
    error: { text: "Offline — will retry", cls: "text-amber-300" },
  };
  const { text, cls } = map[status];
  return <span className={`text-sm font-medium ${cls}`}>{text}</span>;
}
