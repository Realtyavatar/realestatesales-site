"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";

export default function ReportActions({ job }: { job: Job }) {
  const [emailTo, setEmailTo] = useState(job.client_email);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function sendEmail() {
    if (!emailTo.trim()) {
      setMessage({ ok: false, text: "Enter the client's email address first." });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/report/${job.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Sending failed.");
      setMessage({ ok: true, text: `Report emailed to ${emailTo.trim()}.` });
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Sending failed — try again.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card space-y-3 p-4">
      <h2 className="text-lg font-bold">Report</h2>
      <a href={`/api/report/${job.id}`} download className="btn-primary w-full">
        Download PDF report
      </a>
      <div>
        <label className="label" htmlFor="email_to">Email report to</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="email_to"
            type="email"
            inputMode="email"
            className="field sm:flex-1"
            placeholder="client@example.com"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
          <button onClick={sendEmail} disabled={sending} className="btn-navy sm:w-40">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
