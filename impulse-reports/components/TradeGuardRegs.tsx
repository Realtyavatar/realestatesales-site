"use client";

import { useState } from "react";

export default function StandardsLookup() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setSource(null);
    try {
      const res = await fetch("/api/regs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "No answer received.");
      setSource(null);
    } catch {
      setAnswer("Couldn't reach TradeGuard — check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card p-4 space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <span className="text-lg font-bold">📋 Standards Lookup</span>
        <span className="text-navy/50 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 pt-1">
          <p className="text-xs text-navy/50">
            Ask any AS/NZS 3000 or VIC compliance question — powered by TradeGuard.
          </p>
          <textarea
            className="field w-full min-h-[80px] text-sm"
            placeholder="e.g. What's the min clearance for a switchboard in a residential garage?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
            }}
          />
          <button
            onClick={ask}
            disabled={loading || !question.trim()}
            className="btn-navy w-full"
          >
            {loading ? "Looking up…" : "Ask"}
          </button>
          {answer && (
            <div className="rounded-xl bg-navy/5 p-3 space-y-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
              {source && (
                <p className="text-xs text-navy/40 border-t border-navy/10 pt-2">{source}</p>
              )}
            </div>
          )}

        </div>
      )}
    </section>
  );
}
