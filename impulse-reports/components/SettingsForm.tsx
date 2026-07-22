"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import SaveIndicator from "@/components/SaveIndicator";
import { supabaseBrowser } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress";
import { useAutosave } from "@/lib/use-autosave";
import type { Settings } from "@/lib/types";

const DEFAULTS: Settings = {
  id: true,
  business_name: "Impulse Electrical Contractors",
  rec_number: "REC 25266",
  abn: "",
  phone: "",
  email: "",
  address: "",
  logo_path: null,
  default_checklist: [
    { label: "RCD test" },
    { label: "Connections torqued" },
    { label: "Labelling compliant" },
  ],
  updated_at: "",
};

export default function SettingsForm({
  initialSettings,
  initialLogoUrl,
}: {
  initialSettings: Settings | null;
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(initialSettings ?? DEFAULTS);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [newItem, setNewItem] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  const status = useAutosave(settings, async (s) => {
    const { error } = await supabaseBrowser().from("settings").upsert({
      id: true,
      business_name: s.business_name,
      rec_number: s.rec_number,
      abn: s.abn,
      phone: s.phone,
      email: s.email,
      address: s.address,
      logo_path: s.logo_path,
      default_checklist: s.default_checklist,
    });
    if (error) throw error;
  });

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadLogo(file: File | null) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const supabase = supabaseBrowser();
      const blob = await compressImage(file);
      const path = "logo.jpg";
      const { error } = await supabase.storage
        .from("logos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      set("logo_path", path);
      const { data: signed } = await supabase.storage
        .from("logos")
        .createSignedUrl(path, 60 * 60);
      setLogoUrl(signed?.signedUrl ?? null);
    } catch {
      alert("Couldn't upload the logo — check your connection and try again.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-dvh pb-10">
      <TopBar
        title="Settings"
        backHref="/jobs"
        right={<SaveIndicator status={status} />}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-3 py-4">
        <section className="card space-y-4 p-4">
          <h2 className="section-tag">Business details</h2>
          <p className="text-sm text-navy/50">These appear on the cover page of every PDF report.</p>
          <div>
            <label className="label" htmlFor="business_name">Business name</label>
            <input
              id="business_name"
              className="field"
              value={settings.business_name}
              onChange={(e) => set("business_name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="rec_number">REC number</label>
              <input
                id="rec_number"
                className="field-mono"
                value={settings.rec_number}
                onChange={(e) => set("rec_number", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="abn">ABN</label>
              <input
                id="abn"
                className="field-mono"
                value={settings.abn}
                onChange={(e) => set("abn", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                className="field"
                value={settings.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="field"
                value={settings.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="address">Business address</label>
            <input
              id="address"
              className="field"
              value={settings.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="section-tag">Logo</h2>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Business logo"
              className="h-24 w-auto rounded-xl border border-gray-200 bg-white object-contain p-2"
            />
          ) : (
            <p className="text-navy/50">No logo uploaded — the PDF uses your business name instead.</p>
          )}
          <button
            onClick={() => logoInput.current?.click()}
            disabled={uploadingLogo}
            className="btn-outline w-full"
          >
            {uploadingLogo ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
          </button>
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void uploadLogo(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="section-tag">Default checklist</h2>
          <p className="text-sm text-navy/50">
            Every new board starts with these items. You can still add or remove items on each board.
          </p>
          <ul className="space-y-2">
            {settings.default_checklist.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-4 py-3"
              >
                <span className="font-medium">{item.label}</span>
                <button
                  onClick={() =>
                    set(
                      "default_checklist",
                      settings.default_checklist.filter((_, j) => j !== i)
                    )
                  }
                  aria-label={`Remove ${item.label}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-navy/40 active:bg-gray-100"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder="Add default item…"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newItem.trim()) {
                  set("default_checklist", [
                    ...settings.default_checklist,
                    { label: newItem.trim() },
                  ]);
                  setNewItem("");
                }
              }}
            />
            <button
              onClick={() => {
                if (!newItem.trim()) return;
                set("default_checklist", [
                  ...settings.default_checklist,
                  { label: newItem.trim() },
                ]);
                setNewItem("");
              }}
              className="btn-outline w-20 shrink-0"
            >
              Add
            </button>
          </div>
        </section>

        <button onClick={signOut} className="btn-navy w-full">
          Sign out
        </button>
      </main>
    </div>
  );
}
