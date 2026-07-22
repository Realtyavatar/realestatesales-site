import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import NotesSection from "@/components/NotesSection";
import DamageFlags from "@/components/DamageFlags";
import InspectionActions from "@/components/InspectionActions";
import { supabaseServer } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { roomIcon } from "@/lib/rooms";
import type { DamageFlag, Inspection, Photo, Room } from "@/lib/types";

export default async function InspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const [inspectionRes, roomsRes, photosRes, flagsRes] = await Promise.all([
    supabase.from("inspections").select("*").eq("id", id).maybeSingle(),
    supabase.from("rooms").select("*").eq("inspection_id", id).order("sort_order"),
    supabase.from("photos").select("*").eq("inspection_id", id),
    supabase
      .from("damage_flags")
      .select("*")
      .eq("inspection_id", id)
      .order("created_at"),
  ]);

  const inspection = inspectionRes.data as Inspection | null;
  if (!inspection) notFound();

  const rooms = (roomsRes.data ?? []) as Room[];
  const photos = (photosRes.data ?? []) as Photo[];
  const flags = (flagsRes.data ?? []) as DamageFlag[];

  return (
    <div className="min-h-dvh pb-28">
      <TopBar
        title={
          inspection.property_name ||
          inspection.property_address ||
          "Checkout inspection"
        }
        backHref="/inspections"
      />
      <main className="mx-auto max-w-3xl space-y-4 px-3 py-4">
        <section
          className={`card relative p-4 ${
            inspection.status === "complete" ? "pr-32" : ""
          }`}
        >
          <p className="text-sm text-ink/60">
            Checkout inspection · Started{" "}
            <span className="stamp-time">
              {formatDateTime(inspection.started_at)}
            </span>
          </p>
          {inspection.property_address && (
            <p className="mt-1 font-semibold">{inspection.property_address}</p>
          )}
          {inspection.completed_at && (
            <p className="mt-1 text-sm font-semibold text-brand">
              Completed{" "}
              <span className="stamp-time">
                {formatDateTime(inspection.completed_at)}
              </span>
            </p>
          )}
          {inspection.status === "complete" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="stamp text-sm">Complete</span>
            </span>
          )}
        </section>

        <section>
          <h2 className="display mb-2 text-xs text-ink/50">Rooms</h2>
          <ul className="space-y-3">
            {rooms.map((room) => {
              const checked = room.checklist.filter((i) => i.checked).length;
              const total = room.checklist.length;
              const roomPhotos = photos.filter((p) => p.room_id === room.id).length;
              const roomFlags = flags.filter((f) => f.room_id === room.id).length;
              const done = total > 0 && checked === total;
              return (
                <li key={room.id}>
                  <Link
                    href={`/inspections/${inspection.id}/rooms/${room.id}`}
                    className="card flex items-center gap-3 p-4 active:bg-paper"
                  >
                    <span className="tag-hole" aria-hidden />
                    <span className="text-2xl" aria-hidden>
                      {roomIcon(room.room_type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{room.name}</p>
                      <p className="text-sm text-ink/60">
                        {checked}/{total} checked · {roomPhotos} photo
                        {roomPhotos === 1 ? "" : "s"}
                        {roomFlags > 0 && (
                          <span className="font-semibold text-flag">
                            {" "}
                            · {roomFlags} damage
                          </span>
                        )}
                      </p>
                    </div>
                    {done ? (
                      <span className="stamp shrink-0 text-[0.6rem]">Ready</span>
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-sm font-bold text-ink/30"
                      >
                        ✓
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <NotesSection inspection={inspection} />

        <DamageFlags
          inspectionId={inspection.id}
          rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
          initialFlags={flags}
        />

        <InspectionActions inspection={inspection} rooms={rooms} />
      </main>
    </div>
  );
}
