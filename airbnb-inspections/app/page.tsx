"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace("/inspections");
    router.refresh();
  }

  return (
    <main className="min-h-dvh bg-ink flex flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 h-24 w-24">
            <svg viewBox="0 0 64 64" className="h-24 w-24" aria-hidden>
              <g transform="rotate(-8 32 32)">
                <rect x="16" y="12" width="32" height="42" rx="6" fill="#edf1ee" />
                <circle cx="32" cy="20" r="3.2" fill="#11363b" opacity="0.85" />
                <path
                  d="M24 37l6 6 11-12"
                  fill="none"
                  stroke="#0e7d71"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
          <h1 className="display text-2xl text-white">Checkout Inspections</h1>
          <p className="mt-3 text-white/60">
            Walk through. Tick off. Stamp it done.
          </p>
        </div>

        <form onSubmit={signIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="label !text-white/70">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="label !text-white/70">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm font-medium text-red-100">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
