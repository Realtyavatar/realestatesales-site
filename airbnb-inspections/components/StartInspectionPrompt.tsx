"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ROOM_TEMPLATES } from "@/lib/rooms";

// On startup the app prompts the user to begin a checkout inspection: the
// dialog auto-opens once per session (sessionStorage guard so navigating
// back to the list doesn't nag), and the same dialog backs the always-visible
// "Begin checkout inspection" button.
export default function StartInspectionPrompt() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Auto-open once per session, shortly after the list paints.
  useEffect(() => {
    if (sessionStorage.getItem("checkout-prompted")) return;
    sessionStorage.setItem("checkout-prompted", "1");
    const timer = setTimeout(() => setOpen(true), 300);
    return () => clearTimeout(timer);
  }, []);

  async function begin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();

    const { data: inspection, error: insError } = await supabase
      .from("inspections")
      .insert({
        property_name: propertyName.trim(),
        property_address: propertyAddress.trim(),
        inspection_type: "checkout",
      })
      .select()
      .single();

    if (insError || !inspection) {
      setError(insError?.message ?? "Could not start the inspection.");
      setBusy(false);
      return;
    }

    const { error: roomsError } = await supabase.from("rooms").insert(
      ROOM_TEMPLATES.map((template, i) => ({
        inspection_id: inspection.id,
        room_type: template.room_type,
        name: template.name,
        sort_order: i,
        checklist: template.items.map((label, j) => ({
          id: `${template.room_type}-${j}`,
          label,
          checked: false,
        })),
      }))
    );

    if (roomsError) {
      setError(roomsError.message);
      setBusy(false);
      return;
    }

    router.push(`/inspections/${inspection.id}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary w-full text-lg">
        + Begin checkout inspection
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => !busy && setOpen(false)}
        >
          <form
            onSubmit={begin}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold">Begin a checkout inspection?</h2>
            <p className="mt-1 text-sm text-ink/60">
              A guest has checked out — walk through each room, tick off the
              checklist, take timestamped photos and flag any damage.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="property-name" className="label">
                  Property name
                </label>
                <input
                  id="property-name"
                  className="field"
                  placeholder="e.g. Beach House"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="property-address" className="label">
                  Address
                </label>
                <input
                  id="property-address"
                  className="field"
                  placeholder="e.g. 12 Ocean St, Torquay"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn-outline"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Not now
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Starting…" : "Begin"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
