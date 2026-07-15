"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import SaveIndicator from "@/components/SaveIndicator";
import SignaturePad, { type SignaturePadHandle } from "@/components/SignaturePad";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/use-autosave";
import { VARIATION_AUTHORISATION_TEXT } from "@/lib/legal";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Variation } from "@/lib/types";

export default function VariationEditor({
  initialVariation,
  signatureUrl,
}: {
  initialVariation: Variation;
  signatureUrl: string | null;
}) {
  const router = useRouter();
  const [variation, setVariation] = useState(initialVariation);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const padRef = useRef<SignaturePadHandle>(null);

  const signed = Boolean(variation.signed_at);

  const status = useAutosave(variation, async (v) => {
    if (v.signed_at) return; // a signed variation is locked
    const { error } = await supabaseBrowser()
      .from("variations")
      .update({
        description: v.description,
        pricing_mode: v.pricing_mode,
        price_ex_gst: v.price_ex_gst,
        hourly_rate_ex_gst: v.hourly_rate_ex_gst,
        variation_date: v.variation_date,
        signer_name: v.signer_name,
      })
      .eq("id", v.id);
    if (error) throw error;
  });

  function set<K extends keyof Variation>(key: K, value: Variation[K]) {
    setVariation((prev) => ({ ...prev, [key]: value }));
  }

  async function captureSignature() {
    setSignError(null);
    if (!variation.description.trim()) {
      setSignError("Describe the variation before the client signs.");
      return;
    }
    if (
      variation.pricing_mode === "fixed"
        ? variation.price_ex_gst == null
        : variation.hourly_rate_ex_gst == null
    ) {
      setSignError("Enter the agreed price (or hourly rate) before the client signs.");
      return;
    }
    if (!variation.signer_name.trim()) {
      setSignError("Enter the signer's printed name.");
      return;
    }
    const blob = await padRef.current?.getBlob();
    if (!blob) {
      setSignError("The signature box is empty.");
      return;
    }

    setSigning(true);
    try {
      const supabase = supabaseBrowser();
      const path = `${variation.job_id}/${variation.id}.png`;
      const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(path, blob, { contentType: "image/png", upsert: true });
      if (uploadError) throw uploadError;

      const signedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("variations")
        .update({
          // Persist the full current form state together with the signature,
          // so what was signed is exactly what's stored.
          description: variation.description,
          pricing_mode: variation.pricing_mode,
          price_ex_gst: variation.price_ex_gst,
          hourly_rate_ex_gst: variation.hourly_rate_ex_gst,
          variation_date: variation.variation_date,
          signer_name: variation.signer_name.trim(),
          signed_at: signedAt,
          signature_path: path,
        })
        .eq("id", variation.id);
      if (updateError) throw updateError;

      router.refresh();
      setVariation((prev) => ({ ...prev, signed_at: signedAt, signature_path: path }));
    } catch (err) {
      setSignError(
        err instanceof Error
          ? `Couldn't save the signature: ${err.message}`
          : "Couldn't save the signature — check your connection and try again."
      );
    } finally {
      setSigning(false);
    }
  }

  async function deleteVariation() {
    if (!confirm(signed
      ? "Delete this SIGNED variation? The signed authorisation will be lost. This can't be undone."
      : "Delete this variation?")) return;
    const { error } = await supabaseBrowser()
      .from("variations")
      .delete()
      .eq("id", variation.id);
    if (error) {
      alert("Couldn't delete the variation — check your connection and try again.");
      return;
    }
    router.replace(`/jobs/${variation.job_id}`);
    router.refresh();
  }

  return (
    <div className="min-h-dvh pb-10">
      <TopBar
        title="Variation / extra works"
        backHref={`/jobs/${variation.job_id}`}
        right={!signed ? <SaveIndicator status={status} /> : undefined}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-3 py-4">
        {signed && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="font-bold text-emerald-800">✓ Signed and locked</p>
            <p className="mt-1 text-sm text-emerald-800/80">
              Authorised by {variation.signer_name} on {formatDateTime(variation.signed_at)}.
            </p>
          </div>
        )}

        {/* Details */}
        <section className="card space-y-4 p-4">
          <h2 className="text-lg font-bold">Extra works</h2>
          <div>
            <label className="label" htmlFor="description">Description of the extra work</label>
            <textarea
              id="description"
              rows={4}
              className="field disabled:bg-gray-100"
              placeholder="e.g. Supply and install surge protection to MSB…"
              value={variation.description}
              disabled={signed}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <span className="label">Pricing</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={signed}
                onClick={() => set("pricing_mode", "fixed")}
                className={`min-h-[52px] rounded-xl font-bold transition ${
                  variation.pricing_mode === "fixed"
                    ? "bg-navy text-white"
                    : "bg-gray-100 text-navy/60"
                }`}
              >
                Fixed price
              </button>
              <button
                disabled={signed}
                onClick={() => set("pricing_mode", "hourly")}
                className={`min-h-[52px] rounded-xl font-bold transition ${
                  variation.pricing_mode === "hourly"
                    ? "bg-navy text-white"
                    : "bg-gray-100 text-navy/60"
                }`}
              >
                Hourly rate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {variation.pricing_mode === "fixed" ? (
              <div>
                <label className="label" htmlFor="price">Price ex GST ($)</label>
                <input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className="field disabled:bg-gray-100"
                  value={variation.price_ex_gst ?? ""}
                  disabled={signed}
                  onChange={(e) =>
                    set("price_ex_gst", e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="rate">Hourly rate ex GST ($)</label>
                <input
                  id="rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className="field disabled:bg-gray-100"
                  value={variation.hourly_rate_ex_gst ?? ""}
                  disabled={signed}
                  onChange={(e) =>
                    set("hourly_rate_ex_gst", e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="variation_date">Date</label>
              <input
                id="variation_date"
                type="date"
                className="field disabled:bg-gray-100"
                value={variation.variation_date}
                disabled={signed}
                onChange={(e) => set("variation_date", e.target.value)}
              />
            </div>
          </div>

          {variation.pricing_mode === "fixed" && variation.price_ex_gst != null && (
            <p className="text-sm text-navy/60">
              {formatMoney(variation.price_ex_gst)} ex GST ={" "}
              <strong>{formatMoney(variation.price_ex_gst * 1.1)} inc GST</strong>
            </p>
          )}
        </section>

        {/* Authorisation */}
        <section className="card space-y-4 border-2 border-navy/20 p-4">
          <h2 className="text-lg font-bold">Client authorisation</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-navy/80">
            {VARIATION_AUTHORISATION_TEXT.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Placeholder wording — have your solicitor / insurer review this
            before using it with clients. Not legal advice.
          </p>

          <div>
            <label className="label" htmlFor="signer_name">Signer&apos;s printed name</label>
            <input
              id="signer_name"
              className="field disabled:bg-gray-100"
              placeholder="Full name of the person signing"
              value={variation.signer_name}
              disabled={signed}
              onChange={(e) => set("signer_name", e.target.value)}
            />
          </div>

          {signed ? (
            <div>
              <span className="label">Signature</span>
              {signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signatureUrl}
                  alt={`Signature of ${variation.signer_name}`}
                  className="h-40 w-full rounded-xl border border-gray-200 bg-white object-contain"
                />
              ) : (
                <p className="text-navy/50">Signature saved.</p>
              )}
              <p className="mt-1 text-xs text-navy/50">
                Signed {formatDateTime(variation.signed_at)}
              </p>
            </div>
          ) : (
            <>
              <div>
                <span className="label">Signature</span>
                <SignaturePad handleRef={padRef} />
              </div>
              {signError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {signError}
                </p>
              )}
              <button onClick={captureSignature} disabled={signing} className="btn-primary w-full">
                {signing ? "Saving signature…" : "Accept & sign"}
              </button>
            </>
          )}
        </section>

        <button onClick={deleteVariation} className="btn-danger w-full">
          Delete variation
        </button>
      </main>
    </div>
  );
}
