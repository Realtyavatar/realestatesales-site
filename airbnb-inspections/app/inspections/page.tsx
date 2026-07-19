import Link from "next/link";
import TopBar from "@/components/TopBar";
import StartInspectionPrompt from "@/components/StartInspectionPrompt";
import SignOutButton from "@/components/SignOutButton";
import { supabaseServer } from "@/lib/supabase/server";
import { formatDateTime, statusLabel } from "@/lib/format";
import type { Inspection } from "@/lib/types";

export default async function InspectionsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("inspections")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);

  const inspections = (data ?? []) as Inspection[];

  return (
    <div className="min-h-dvh pb-28">
      <TopBar title="Checkout Inspections" right={<SignOutButton />} />
      <main className="mx-auto max-w-3xl px-3 py-4">
        <StartInspectionPrompt />

        <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-ink/50">
          Past inspections
        </h2>

        {inspections.length === 0 ? (
          <p className="card p-6 text-center text-ink/50">
            No inspections yet. Begin your first checkout inspection above.
          </p>
        ) : (
          <ul className="space-y-3">
            {inspections.map((inspection) => (
              <li key={inspection.id}>
                <Link
                  href={`/inspections/${inspection.id}`}
                  className="card flex items-center gap-4 p-4 active:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {inspection.property_name ||
                        inspection.property_address ||
                        "Untitled property"}
                    </p>
                    {inspection.property_name && inspection.property_address && (
                      <p className="truncate text-sm text-ink/60">
                        {inspection.property_address}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm text-ink/50">
                      Started {formatDateTime(inspection.started_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      inspection.status === "complete"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {statusLabel(inspection.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
