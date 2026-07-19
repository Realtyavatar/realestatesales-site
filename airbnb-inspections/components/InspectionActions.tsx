"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Inspection, Room } from "@/lib/types";

export default function InspectionActions({
  inspection,
  rooms,
}: {
  inspection: Inspection;
  rooms: Room[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const unchecked = rooms.reduce(
    (n, room) => n + room.checklist.filter((i) => !i.checked).length,
    0
  );

  async function setStatus(complete: boolean) {
    if (
      complete &&
      unchecked > 0 &&
      !confirm(
        `${unchecked} checklist item${unchecked === 1 ? "" : "s"} are still unchecked. Mark the inspection complete anyway?`
      )
    ) {
      return;
    }
    setBusy(true);
    const { error } = await supabaseBrowser()
      .from("inspections")
      .update({
        status: complete ? "complete" : "in_progress",
        completed_at: complete ? new Date().toISOString() : null,
      })
      .eq("id", inspection.id);
    setBusy(false);
    if (error) {
      alert("Couldn't update the inspection — check your connection and try again.");
      return;
    }
    router.refresh();
  }

  async function deleteInspection() {
    if (!confirm("Delete this inspection and all its photos and damage flags?")) return;
    if (!confirm("This can't be undone. Delete permanently?")) return;
    setBusy(true);
    const { error } = await supabaseBrowser()
      .from("inspections")
      .delete()
      .eq("id", inspection.id);
    setBusy(false);
    if (error) {
      alert("Couldn't delete the inspection — check your connection and try again.");
      return;
    }
    router.replace("/inspections");
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <a
        href={`/api/inspections/${inspection.id}/report`}
        className="btn-ink w-full"
      >
        ⬇ Download PDF report
      </a>
      {inspection.status === "complete" ? (
        <button
          onClick={() => setStatus(false)}
          disabled={busy}
          className="btn-outline w-full"
        >
          Re-open inspection
        </button>
      ) : (
        <button
          onClick={() => setStatus(true)}
          disabled={busy}
          className="btn-primary w-full"
        >
          ✓ Mark inspection complete
        </button>
      )}
      <button
        onClick={deleteInspection}
        disabled={busy}
        className="w-full py-2 text-sm font-semibold text-red-600"
      >
        Delete inspection
      </button>
    </section>
  );
}
