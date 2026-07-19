import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import RoomChecklist from "@/components/RoomChecklist";
import RoomPhotoSection from "@/components/RoomPhotoSection";
import DamageFlags from "@/components/DamageFlags";
import { supabaseServer } from "@/lib/supabase/server";
import type { DamageFlag, Photo, Room } from "@/lib/types";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string; roomId: string }>;
}) {
  const { id, roomId } = await params;
  const supabase = await supabaseServer();

  const [roomRes, photosRes, flagsRes] = await Promise.all([
    supabase.from("rooms").select("*").eq("id", roomId).maybeSingle(),
    supabase
      .from("photos")
      .select("*")
      .eq("room_id", roomId)
      .order("sort_order"),
    supabase
      .from("damage_flags")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at"),
  ]);

  const room = roomRes.data as Room | null;
  if (!room || room.inspection_id !== id) notFound();

  const photos = (photosRes.data ?? []) as Photo[];
  const flags = (flagsRes.data ?? []) as DamageFlag[];

  return (
    <div className="min-h-dvh pb-28">
      <TopBar title={room.name} backHref={`/inspections/${id}`} />
      <main className="mx-auto max-w-3xl space-y-4 px-3 py-4">
        <RoomChecklist room={room} />
        <RoomPhotoSection
          inspectionId={id}
          roomId={room.id}
          initialPhotos={photos}
        />
        <DamageFlags
          inspectionId={id}
          rooms={[{ id: room.id, name: room.name }]}
          fixedRoomId={room.id}
          initialFlags={flags}
        />
      </main>
    </div>
  );
}
