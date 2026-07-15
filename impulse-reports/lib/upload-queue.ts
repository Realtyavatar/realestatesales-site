"use client";

import { supabaseBrowser } from "./supabase/client";

// Offline-tolerant photo upload queue.
//
// Photos are compressed, then persisted to IndexedDB *before* any network
// call, so nothing is lost if the connection drops or the tab is closed.
// The queue drains whenever: a photo is added, the browser comes back
// online, or the periodic retry timer fires. Uploads are idempotent (stable
// storage path + upsert) so a retry can never create duplicates.

const DB_NAME = "impulse-reports";
const STORE = "photo-uploads";
const RETRY_INTERVAL_MS = 20_000;

export interface QueuedPhoto {
  id: string; // photo row id + storage file name (stable across retries)
  jobId: string;
  boardId: string;
  blob: Blob;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(item: QueuedPhoto): Promise<void> {
  const db = await openDb();
  await idbRequest(db.transaction(STORE, "readwrite").objectStore(STORE).put(item));
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDb();
  await idbRequest(db.transaction(STORE, "readwrite").objectStore(STORE).delete(id));
}

async function idbAll(): Promise<QueuedPhoto[]> {
  const db = await openDb();
  return idbRequest(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
}

type Listener = () => void;
const listeners = new Set<Listener>();
let draining = false;
let timerStarted = false;

function notify() {
  listeners.forEach((fn) => fn());
}

/** Subscribe to queue changes (pending count, completed uploads). */
export function onQueueChange(fn: Listener): () => void {
  listeners.add(fn);
  ensureBackgroundRetry();
  return () => listeners.delete(fn);
}

export async function pendingForBoard(boardId: string): Promise<QueuedPhoto[]> {
  try {
    return (await idbAll()).filter((q) => q.boardId === boardId);
  } catch {
    return [];
  }
}

function ensureBackgroundRetry() {
  if (timerStarted || typeof window === "undefined") return;
  timerStarted = true;
  window.addEventListener("online", () => void drainQueue());
  window.setInterval(() => void drainQueue(), RETRY_INTERVAL_MS);
}

/** Queue a compressed photo blob for upload. Returns once it is safely persisted locally. */
export async function enqueuePhoto(jobId: string, boardId: string, blob: Blob): Promise<void> {
  const item: QueuedPhoto = {
    id: crypto.randomUUID(),
    jobId,
    boardId,
    blob,
    createdAt: Date.now(),
    attempts: 0,
  };
  await idbPut(item);
  notify();
  void drainQueue();
}

export async function drainQueue(): Promise<void> {
  if (draining || typeof navigator === "undefined" || !navigator.onLine) return;
  draining = true;
  try {
    const items = await idbAll();
    for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
      const ok = await uploadOne(item);
      if (ok) {
        await idbDelete(item.id);
        notify();
      } else {
        item.attempts += 1;
        await idbPut(item);
        notify();
        break; // stop the pass; retry timer / online event will try again
      }
    }
  } finally {
    draining = false;
  }
}

async function uploadOne(item: QueuedPhoto): Promise<boolean> {
  const supabase = supabaseBrowser();
  const path = `${item.jobId}/${item.boardId}/${item.id}.jpg`;
  try {
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, item.blob, { contentType: "image/jpeg", upsert: true });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("photos").upsert(
      {
        id: item.id,
        job_id: item.jobId,
        board_id: item.boardId,
        storage_path: path,
        sort_order: item.createdAt,
      },
      { onConflict: "id" }
    );
    if (insertError) throw insertError;
    return true;
  } catch (err) {
    item.lastError = err instanceof Error ? err.message : String(err);
    return false;
  }
}
