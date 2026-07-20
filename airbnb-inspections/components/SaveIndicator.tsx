"use client";

import type { SaveStatus } from "@/lib/use-autosave";

export default function SaveIndicator({
  status,
  tone = "dark",
}: {
  status: SaveStatus;
  /** "dark" for the dark top bar, "light" for white cards. */
  tone?: "dark" | "light";
}) {
  if (status === "idle") return null;
  const map: Record<
    Exclude<SaveStatus, "idle">,
    { text: string; dark: string; light: string }
  > = {
    pending: { text: "Typing…", dark: "text-white/60", light: "text-ink/50" },
    saving: { text: "Saving…", dark: "text-white/80", light: "text-ink/60" },
    saved: { text: "✓ Synced", dark: "text-emerald-300", light: "text-emerald-600" },
    error: {
      text: "Offline — will retry",
      dark: "text-amber-300",
      light: "text-amber-600",
    },
  };
  const entry = map[status];
  return (
    <span className={`text-sm font-medium ${tone === "dark" ? entry.dark : entry.light}`}>
      {entry.text}
    </span>
  );
}
