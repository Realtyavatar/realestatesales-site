---
name: verify
description: Drive the Checkout Inspections app end-to-end against a mock Supabase, in headless Chromium.
---

# Verifying Checkout Inspections (this directory)

The app needs a Supabase backend. `e2e/mock-supabase.mjs` is an in-memory mock
of the Supabase HTTP surface (GoTrue password login, PostgREST with `eq.`
filters/order/limit/upsert, Storage with multipart upload parsing + signed
URLs). `e2e/drive.mjs` drives every flow in Chromium: login, the startup
prompt, beginning an inspection (four rooms), checklist autosave + flush on
navigation, the offline photo queue with timestamp burn-in, damage flags
(severity + notes, room and whole-property), overall notes, mark-complete
confirm, and the timestamped PDF download.

```bash
cd airbnb-inspections
npm install
node e2e/mock-supabase.mjs &                     # port 54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key npx next build
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key npx next start &
node e2e/drive.mjs                               # needs `npm i playwright` somewhere importable
```

Login for the mock: `host@example.com` / `test-password-123`.

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
- Playwright's `text=` engine does not match `<input>` values — assert with
  `page.inputValue(...)` after a reload instead.
- After clicking "Flag damage" on the overview, wait for the new row
  (`nth(1)`) before filling — `.last()` resolves before React re-renders and
  hits the wrong flag.
- The PDF can be inspected by Read-ing the downloaded `report.pdf` directly.
