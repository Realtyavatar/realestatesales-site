"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { processPhoto } from "@/lib/photo";
import { formatDateTime } from "@/lib/format";
import {
  drainQueue,
  enqueuePhoto,
  onQueueChange,
  pendingForRoom,
  type QueuedPhoto,
} from "@/lib/upload-queue";
import type { Photo } from "@/lib/types";

export default function RoomPhotoSection({
  inspectionId,
  roomId,
  initialPhotos,
}: {
  inspectionId: string;
  roomId: string;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<QueuedPhoto[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const captionTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const refreshPhotos = useCallback(async () => {
    const { data } = await supabaseBrowser()
      .from("photos")
      .select("*")
      .eq("room_id", roomId)
      .order("sort_order");
    if (data) setPhotos(data as Photo[]);
  }, [roomId]);

  // Signed URLs for display (private bucket)
  useEffect(() => {
    const paths = photos.map((p) => p.storage_path).filter((p) => !(p in urls));
    if (paths.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabaseBrowser()
        .storage.from("photos")
        .createSignedUrls(paths, 60 * 60);
      if (cancelled || !data) return;
      setUrls((prev) => {
        const next = { ...prev };
        data.forEach((d, i) => {
          if (d.signedUrl) next[paths[i]] = d.signedUrl;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  // Track the upload queue: show pending items, refresh grid as they land.
  useEffect(() => {
    let alive = true;
    const update = async () => {
      const items = await pendingForRoom(roomId);
      if (!alive) return;
      setPending((prev) => {
        if (prev.length > 0 && items.length < prev.length) void refreshPhotos();
        return items;
      });
    };
    void update();
    const unsubscribe = onQueueChange(() => void update());
    void drainQueue();
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [roomId, refreshPhotos]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      // Capture time is stamped now — both onto the image itself and into the
      // database — so the report can prove when each photo was taken.
      const takenAt = new Date();
      const processed = await processPhoto(file, takenAt);
      await enqueuePhoto(inspectionId, roomId, processed, takenAt);
    }
  }

  function setCaption(photoId: string, caption: string) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
    clearTimeout(captionTimers.current[photoId]);
    captionTimers.current[photoId] = setTimeout(async () => {
      // PostgREST builders are lazy — the request only fires when awaited.
      const { error } = await supabaseBrowser()
        .from("photos")
        .update({ caption })
        .eq("id", photoId);
      if (error) console.warn("caption save failed, will retry on next edit:", error.message);
    }, 800);
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm("Delete this photo?")) return;
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) {
      alert("Couldn't delete the photo — check your connection and try again.");
      return;
    }
    void supabase.storage.from("photos").remove([photo.storage_path]);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Photos</h2>
        <span className="text-sm text-ink/50">{photos.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <figure key={photo.id} className="overflow-hidden rounded-xl border border-gray-200">
            <div className="relative aspect-square bg-gray-100">
              {urls[photo.storage_path] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[photo.storage_path]}
                  alt={photo.caption || "Room photo"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink/40">
                  Loading…
                </div>
              )}
              <button
                onClick={() => deletePhoto(photo)}
                aria-label="Delete photo"
                className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <figcaption className="p-2">
              <p className="mb-1 px-1 text-xs text-ink/50">
                {formatDateTime(photo.taken_at)}
              </p>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
                placeholder="Caption (optional)"
                value={photo.caption}
                onChange={(e) => setCaption(photo.id, e.target.value)}
              />
            </figcaption>
          </figure>
        ))}

        {pending.map((item) => (
          <div
            key={item.id}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 p-3 text-center"
          >
            <svg className="h-8 w-8 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-xs font-semibold text-brand-dark">
              {item.attempts > 0 ? "Waiting for signal — will retry" : "Syncing to cloud…"}
            </p>
          </div>
        ))}
      </div>

      {photos.length === 0 && pending.length === 0 && (
        <p className="py-4 text-center text-ink/50">
          No photos yet. Take one for the record — the date and time are stamped
          on automatically.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => cameraInput.current?.click()} className="btn-primary">
          📷 Take photo
        </button>
        <button onClick={() => galleryInput.current?.click()} className="btn-outline">
          🖼 From gallery
        </button>
      </div>

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
}
