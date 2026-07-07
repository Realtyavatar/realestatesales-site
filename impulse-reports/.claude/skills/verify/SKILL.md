---
name: verify
description: Drive the Impulse Reports app end-to-end against a mock Supabase, in headless Chromium.
---

# Verifying Impulse Reports (this directory)

The app needs a Supabase backend. `e2e/mock-supabase.mjs` is an in-memory mock
of the Supabase HTTP surface (GoTrue password login, PostgREST with `eq.`
filters/order/limit/upsert, Storage with multipart upload parsing + signed
URLs), pre-seeded like the real migrations. `e2e/drive.mjs` drives every flow
in Chromium: login, search, autosave, boards/checklist, offline photo queue,
canvas signature, PDF download, settings.

```bash
cd impulse-reports
npm install
node e2e/mock-supabase.mjs &                     # port 54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key npx next build
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key npx next start &
node e2e/drive.mjs                               # needs `npm i playwright` somewhere importable
```

Login for the mock: `info@impulseelectrical.com.au` / `test-password-123`.

Gotchas learned the hard way:

- **Use `next start`, not `next dev`** — in this sandbox the dev HMR websocket
  is blocked cross-origin and client components never hydrate, so every click
  does a native form submit.
- Launch Chromium with `executablePath: "/opt/pw-browsers/chromium"` and
  `args: ["--no-proxy-server"]` — the env's HTTPS proxy otherwise swallows
  localhost requests from the browser.
- Restart the mock before every drive run; state persists and `page.fill`
  with an unchanged value fires no React change event (autosave waits forever).
- `fuser -k 54321/tcp` / `fuser -k 3000/tcp` to kill servers — `pkill -f`
  matches your own shell command and kills it (exit 144).
- Supabase PostgREST builders are lazy thenables: `void supabase.from(...)`
  sends nothing. Always await (this caused a real bug once).
- The PDF can be inspected by Read-ing the downloaded `report.pdf` directly.
