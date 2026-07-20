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
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-ink-light">
            <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
              <path d="M32 12 12 30h5v20h30V30h5L32 12z" fill="#ff385c" />
              <path
                d="M25 36l5 5 10-10"
                fill="none"
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Checkout Inspections</h1>
          <p className="mt-2 text-white/60">
            Airbnb property inspection checklists
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
