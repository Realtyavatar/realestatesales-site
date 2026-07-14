"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;
const RETRY_MS = 5000;

/**
 * Debounced autosave: call `save` with the latest value shortly after it stops
 * changing. Failed saves retry automatically (flaky mobile data), and a new
 * edit always supersedes an in-flight retry.
 *
 * Unsaved edits are flushed immediately when the component unmounts (Back
 * navigation), the tab is hidden (switching apps on a phone), or the page is
 * unloading — so tapping a checklist result and immediately leaving the
 * screen can't lose the change.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<void>
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [retryTick, setRetryTick] = useState(0);
  const first = useRef(true);
  const saveRef = useRef(save);
  const latestRef = useRef(value);
  const dirty = useRef(false);
  const ticket = useRef(0);

  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    latestRef.current = value;
    dirty.current = true;
    setStatus("pending");
    const myTicket = ++ticket.current;
    const timer = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveRef.current(value);
        if (myTicket === ticket.current) {
          dirty.current = false;
          setStatus("saved");
        }
      } catch {
        if (myTicket === ticket.current) {
          setStatus("error");
          setTimeout(() => {
            if (myTicket === ticket.current) setRetryTick((t) => t + 1);
          }, RETRY_MS);
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, retryTick]);

  // Flush pending edits when leaving: unmount, app switch, page unload.
  useEffect(() => {
    const flush = () => {
      if (!dirty.current) return;
      dirty.current = false;
      ticket.current++; // supersede any pending debounce/retry
      void saveRef.current(latestRef.current).catch(() => {
        // Last-chance save on the way out — nowhere left to surface an error.
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  return status;
}
