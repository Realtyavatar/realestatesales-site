"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;
const RETRY_MS = 5000;

/**
 * Debounced autosave: call `save` with the latest value shortly after it stops
 * changing. Failed saves retry automatically (flaky mobile data), and a new
 * edit always supersedes an in-flight retry.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<void>
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [retryTick, setRetryTick] = useState(0);
  const first = useRef(true);
  const saveRef = useRef(save);
  const ticket = useRef(0);

  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("pending");
    const myTicket = ++ticket.current;
    const timer = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveRef.current(value);
        if (myTicket === ticket.current) setStatus("saved");
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

  return status;
}
