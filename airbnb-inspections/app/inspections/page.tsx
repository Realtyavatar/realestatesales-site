import Link from "next/link";
import TopBar from "@/components/TopBar";
import StartInspectionPrompt from "@/components/StartInspectionPrompt";
import SignOutButton from "@/components/SignOutButton";
import { supabaseServer } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
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

        <h2 className="display mb-2 mt-6 text-xs text-ink/50">
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
                      Started{" "}
                      <span className="stamp-time">
                        {formatDateTime(inspection.started_at)}
                      </span>
                    </p>
                  </div>
                  {inspection.status === "complete" ? (
                    <span className="stamp shrink-0 text-[0.6rem]">Complete</span>
                  ) : (
                    <span className="stamp stamp-tag shrink-0 text-[0.6rem]">
                      In progress
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
