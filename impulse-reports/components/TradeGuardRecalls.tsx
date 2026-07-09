"use client";

import { useEffect, useState } from "react";

const TRADEGUARD_URL = "https://tradeguardaus.com.au";

type Recall = {
  id: string;
  product: string;
  brand: string;
  model: string;
  hazard: string;
  severity: "critical" | "high" | "medium";
  date: string;
  action: string;
  units: string;
  accc_url?: string;
  acccUrl?: string;
};

function severityBadge(severity: Recall["severity"]) {
  if (severity === "critical") return "bg-red-600 text-white";
  if (severity === "high") return "bg-orange-500 text-white";
  return "bg-yellow-400 text-gray-900";
}

export default function TradeGuardRecalls() {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${TRADEGUARD_URL}/api/recalls?trade=electrician`)
      .then((r) => r.json())
      .then((data) => {
        const list: Recall[] = data.recalls ?? [];
        // Show critical + high only, sorted by severity then date
        const priority = list
          .filter((r) => r.severity === "critical" || r.severity === "high")
          .sort((a, b) => {
            if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          })
          .slice(0, 6);
        setRecalls(priority);
      })
      .catch(() => setError("Couldn't load recalls — check tradeguardaus.com.au"))
      .finally(() => setLoading(false));
  }, []);

  const criticalCount = recalls.filter((r) => r.severity === "critical").length;

  return (
    <section className="card p-4 space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">⚡ Product Recalls</span>
          {!loading && criticalCount > 0 && (
            <span className="rounded-full bg-red-600 text-white text-xs font-bold px-2 py-0.5">
              {criticalCount} CRITICAL
            </span>
          )}
          {!loading && recalls.length === 0 && !error && (
            <span className="rounded-full bg-emerald-500 text-white text-xs font-bold px-2 py-0.5">
              All clear
            </span>
          )}
        </div>
        <span className="text-navy/50 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 pt-1">
          {loading && (
            <p className="text-sm text-navy/50">Checking ACCC recalls…</p>
          )}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {!loading && recalls.length === 0 && !error && (
            <p className="text-sm text-emerald-700">No critical or high-severity recalls active for electricians right now.</p>
          )}
          {recalls.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm leading-snug">{r.brand} {r.product}</p>
                  {r.model && <p className="text-xs text-navy/50">{r.model}</p>}
                </div>
                <span className={`shrink-0 rounded-full text-xs font-bold px-2 py-0.5 ${severityBadge(r.severity)}`}>
                  {r.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-navy/70 leading-snug">{r.hazard.slice(0, 120)}{r.hazard.length > 120 ? "…" : ""}</p>
              <p className="text-xs font-medium text-navy/80">⚠️ {r.action.slice(0, 100)}{r.action.length > 100 ? "…" : ""}</p>
              {(r.accc_url || r.acccUrl) && (
                <a
                  href={r.accc_url ?? r.acccUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  ACCC recall notice →
                </a>
              )}
            </div>
          ))}
          <a
            href={TRADEGUARD_URL}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-xs text-navy/50 underline pt-1"
          >
            Full recall database & compliance tool — tradeguardaus.com.au
          </a>
        </div>
      )}
    </section>
  );
}
