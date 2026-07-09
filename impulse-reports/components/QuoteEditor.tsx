"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import SaveIndicator from "@/components/SaveIndicator";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { formatDate, formatMoney } from "@/lib/format";
import type { Job, Quote, QuoteItem, QuoteStatus, Settings } from "@/lib/types";

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: "draft",    label: "Draft"    },
  { value: "sent",     label: "Sent"     },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function QuoteEditor({
  initialQuote,
  job,
  settings,
}: {
  initialQuote: Quote;
  job: Job;
  settings: Settings | null;
}) {
  const router = useRouter();
  const [quote, setQuote] = useState(initialQuote);
  const [items, setItems] = useState<QuoteItem[]>(
    Array.isArray(initialQuote.items) ? initialQuote.items : []
  );
  const [deleting, setDeleting] = useState(false);

  const saveStatus = useAutosave({ ...quote, items }, async (q) => {
    const { error } = await supabaseBrowser()
      .from("quotes")
      .update({
        quote_number: q.quote_number,
        quote_date:   q.quote_date,
        expiry_date:  q.expiry_date,
        status:       q.status,
        notes:        q.notes,
        terms:        q.terms,
        items:        q.items,
      })
      .eq("id", q.id);
    if (error) throw error;
  });

  function setQ<K extends keyof Quote>(key: K, value: Quote[K]) {
    setQuote((prev) => ({ ...prev, [key]: value }));
  }

  function updateItems(newItems: QuoteItem[]) {
    setItems(newItems);
    // patch items immediately so the save indicator shows activity
    setQuote((prev) => ({ ...prev, items: newItems as any }));
  }

  function addItem(isLabour: boolean) {
    updateItems([...items, { id: genId(), description: "", qty: 1, unit_price: 0, is_labour: isLabour }]);
  }

  function removeItem(id: string) {
    updateItems(items.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof QuoteItem, value: string | number | boolean) {
    updateItems(items.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  async function deleteQuote() {
    if (!confirm("Delete this quote?")) return;
    setDeleting(true);
    const { error } = await supabaseBrowser().from("quotes").delete().eq("id", quote.id);
    if (error) { alert("Couldn't delete — check connection."); setDeleting(false); return; }
    router.replace(`/jobs/${quote.job_id}`);
    router.refresh();
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const gst      = subtotal * 0.1;
  const total    = subtotal + gst;

  const statusClasses: Record<QuoteStatus, string> = {
    draft:    "bg-gray-100 text-gray-700",
    sent:     "bg-blue-100 text-blue-800",
    accepted: "bg-emerald-100 text-emerald-800",
    declined: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-dvh pb-10">
      <TopBar
        title={quote.quote_number || "Quote"}
        backHref={`/jobs/${quote.job_id}`}
        right={<SaveIndicator status={saveStatus} />}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-3 py-4">

        {/* Status */}
        <section className="card p-4">
          <span className="label">Status</span>
          <div className="grid grid-cols-4 gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setQ("status", s.value)}
                className={`min-h-[44px] rounded-xl text-sm font-bold transition ${
                  quote.status === s.value
                    ? "bg-navy text-white"
                    : "bg-gray-100 text-navy/60 active:bg-gray-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Quote details */}
        <section className="card space-y-4 p-4">
          <h2 className="text-lg font-bold">Quote details</h2>
          <div>
            <label className="label" htmlFor="quote_number">Quote number</label>
            <input
              id="quote_number"
              className="field"
              value={quote.quote_number}
              onChange={(e) => setQ("quote_number", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="quote_date">Issue date</label>
              <input
                id="quote_date"
                type="date"
                className="field"
                value={quote.quote_date}
                onChange={(e) => setQ("quote_date", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="expiry_date">Expiry date</label>
              <input
                id="expiry_date"
                type="date"
                className="field"
                value={quote.expiry_date ?? ""}
                onChange={(e) => setQ("expiry_date", e.target.value || null)}
              />
            </div>
          </div>
        </section>

        {/* Line items */}
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Line items</h2>
            <div className="flex gap-2">
              <button onClick={() => addItem(true)}  className="btn-outline px-3 py-1 text-sm">+ Labour</button>
              <button onClick={() => addItem(false)} className="btn-outline px-3 py-1 text-sm">+ Material</button>
            </div>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-navy/50">No items yet — add labour or material lines above.</p>
          )}

          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className={`rounded-xl border border-gray-200 p-3 border-l-4 ${
                  item.is_labour ? "border-l-navy" : "border-l-orange-500"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wide ${item.is_labour ? "text-navy" : "text-orange-600"}`}>
                    {item.is_labour ? "🔧 Labour" : "📦 Material"}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-lg leading-none text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
                <input
                  className="field mb-2"
                  placeholder={item.is_labour ? "e.g. Labour – switchboard upgrade (4hr)" : "e.g. Clipsal 18-way enclosure"}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="label text-xs">Qty</label>
                    <input
                      type="number" min="0.01" step="0.01" inputMode="decimal"
                      className="field"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Unit price (ex GST)</label>
                    <input
                      type="number" min="0" step="0.01" inputMode="decimal"
                      className="field"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="pb-1 text-right">
                    <p className="text-xs text-navy/50 mb-1">Total</p>
                    <p className="font-bold text-navy">{formatMoney(item.qty * item.unit_price)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Totals */}
        <section className="card bg-gray-50 p-4">
          <div className="space-y-2">
            {([ ["Subtotal (ex GST)", formatMoney(subtotal)], ["GST (10%)", formatMoney(gst)] ] as [string,string][]).map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-navy/60">{l}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between border-t-2 border-navy pt-2">
              <span className="font-bold text-navy">TOTAL (inc GST)</span>
              <span className="text-xl font-black text-orange-600">{formatMoney(total)}</span>
            </div>
          </div>
        </section>

        {/* Notes + Terms */}
        <section className="card space-y-4 p-4">
          <div>
            <label className="label" htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes" rows={3} className="field"
              placeholder="Any extra notes for the client…"
              value={quote.notes}
              onChange={(e) => setQ("notes", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="terms">Terms &amp; Conditions</label>
            <textarea
              id="terms" rows={4} className="field text-sm"
              value={quote.terms}
              onChange={(e) => setQ("terms", e.target.value)}
            />
          </div>
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <a
            href={`/api/quote/${quote.id}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full block text-center"
          >
            ⬇ Download Quote PDF
          </a>

          {job.client_email && (
            <button
              className="btn-outline w-full"
              onClick={() => {
                const subject = encodeURIComponent(`Quote ${quote.quote_number} — ${job.site_address}`);
                const body    = encodeURIComponent(
                  `Hi ${job.client_name},\n\nPlease find attached your quote for work at ${job.site_address}.\n\nQuote: ${quote.quote_number}\nTotal (inc GST): ${formatMoney(total)}\nValid until: ${quote.expiry_date ? formatDate(quote.expiry_date) : "—"}\n\nPlease don't hesitate to contact us with any questions.\n\nRegards,\n${settings?.business_name ?? "Impulse Electrical Contractors"}`
                );
                window.open(`mailto:${job.client_email}?subject=${subject}&body=${body}`);
              }}
            >
              ✉ Email to {job.client_email}
            </button>
          )}
        </section>

        <button onClick={deleteQuote} disabled={deleting} className="btn-danger w-full">
          {deleting ? "Deleting…" : "Delete quote"}
        </button>

      </main>
    </div>
  );
}
