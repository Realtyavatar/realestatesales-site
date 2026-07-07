import { notFound } from "next/navigation";
import BoardEditor from "@/components/BoardEditor";
import { supabaseServer } from "@/lib/supabase/server";
import type { Board, Photo } from "@/lib/types";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string; boardId: string }>;
}) {
  const { id, boardId } = await params;
  const supabase = await supabaseServer();

  const [boardRes, photosRes] = await Promise.all([
    supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .eq("job_id", id)
      .maybeSingle(),
    supabase
      .from("photos")
      .select("*")
      .eq("board_id", boardId)
      .order("sort_order"),
  ]);

  const board = boardRes.data as Board | null;
  if (!board) notFound();

  return (
    <BoardEditor
      initialBoard={board}
      initialPhotos={(photosRes.data ?? []) as Photo[]}
    />
  );
}
