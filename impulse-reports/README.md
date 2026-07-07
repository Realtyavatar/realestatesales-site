# Impulse Reports

Mobile-first job reporting for **Impulse Electrical Contractors** (REC 25266,
Victoria). Built for a phone on a job site: big touch targets, autosave on
every keystroke, photo uploads that survive signal dropouts, client sign-off
on screen, and one-tap branded PDF reports.

**Stack:** Next.js 16 (App Router) + Supabase (auth, Postgres, storage) +
Tailwind CSS 4 + pdf-lib. Deploys to Vercel.

> This app lives in the `impulse-reports/` subdirectory of the repo and is
> completely independent of the site at the repo root. On Vercel you point the
> project's **Root Directory** at `impulse-reports` (step-by-step below).

---

## What it does

- **Jobs** — client, phone, email, site address, job type, date, notes.
  Searchable by address or client name, sorted by most recent activity, with
  Draft / In Progress / Complete status. Everything autosaves as you type
  (watch the indicator in the top bar), so you can walk away mid-job and pick
  it up later on any device.
- **Boards** — each job holds any number of boards (MSB, GMB-1, Unit 14…)
  with location, rating (A), fault level, and a customisable checklist
  (defaults from Settings; Pass / Fail / N/A per item). Mark a board
  **Defects found** with a severity (safety issue / non-compliance /
  recommendation) and description.
- **Photos** — take with the camera or pick from the gallery, multiple per
  board, optional captions. Compressed on the phone (max 1600px JPEG) before
  upload. If the connection drops, photos queue in the browser's IndexedDB
  and retry automatically — nothing is lost, even if you close the tab.
- **Defects register** — every board marked with defects appears
  automatically in the job's register and in the PDF. It can't drift out of
  sync because it's derived, not copied.
- **Variations / extra works** — describe the work, fixed price or hourly
  rate ex GST, date, then the client signs on your screen. The signature is
  saved as an image with a timestamp and the signer's printed name, and the
  variation locks against editing. Signed variations appear in the PDF with
  the signature embedded.
- **PDF report** — one tap: branded cover (logo or business name, REC
  number, ABN), client/site details, a section per board with checklist
  results and photos, the defects register, recommendations, and all
  variations. Download it, or email it to the client from the app (Resend).
- **Settings** — business details, logo upload, default checklist items,
  sign out.

## Assumptions made (you said zero questions)

- **Single user.** One login (you). Signups are disabled; all data belongs to
  the authenticated user. No roles, no sharing.
- **Autosave over save buttons.** There is no Save button anywhere — jobs,
  boards, settings and unsigned variations save ~1 second after you stop
  typing and retry automatically on flaky data.
- **Defects live on boards.** "Defects found" is a dedicated toggle +
  severity + description per board (not a checklist row), because the defects
  register and PDF are built from it.
- **Signed variations are immutable.** Once signed, the form locks. If the
  scope changes again, create a new variation (that's also the defensible
  paper trail). Deleting a signed variation asks twice, but is possible.
- **Photos are compressed to ~1600px JPEG.** Plenty for an A4 report and
  10–20× smaller on mobile data than raw phone photos.
- **Email needs a (free) Resend account.** Without it the Email button
  explains itself and Download still works. `mailto:` can't attach a PDF, so
  a mail API is the pragmatic choice.
- **The variation authorisation wording is a placeholder.** It says what you
  asked (authorises the work, price + GST on top of the contract, no
  commencement until signed, subject to ACL and Victorian domestic building
  requirements) in plain English, but **it is not legal advice — have your
  solicitor/insurer approve it before using it with clients**. The text lives
  in one place: `lib/legal.ts`.
- **Seed data.** Migration `0002` creates one example job ("14 Sample
  Street") with two boards and a defect so the app isn't empty on first
  login. Delete it from the app whenever.

---

## Deploying: Supabase + Vercel, step by step

You'll create a Supabase project (database + login + file storage), then a
Vercel project (the app itself). ~20 minutes.

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick any
   name (e.g. `impulse-reports`), a strong database password (save it
   somewhere), and the **Sydney** region.
2. When it finishes provisioning, open **SQL Editor** (left sidebar) →
   **New query**. Paste the entire contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and click **Run**. It creates the tables, security policies and the three
   private storage buckets (`photos`, `signatures`, `logos`).
3. New query again → paste
   [`supabase/migrations/0002_seed_example_job.sql`](supabase/migrations/0002_seed_example_job.sql)
   → **Run**. That's the example job.
4. Create your login: **Authentication → Users → Add user → Create new
   user**. Use your email and a strong password, and tick **Auto Confirm
   User**.
5. Lock the door behind you: **Authentication → Sign In / Providers →
   Email** → turn **OFF** "Allow new users to sign up" → Save.
6. Grab your keys: **Project Settings → API Keys**. You need:
   - **Project URL** (like `https://abcd1234.supabase.co`)
   - **anon / public** key

### 2. Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   this GitHub repository.
2. **Important:** under **Root Directory**, click Edit and select
   `impulse-reports`. (Framework preset: Next.js — detected automatically.)
3. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from step 1.6 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key from step 1.6 |

4. Click **Deploy**. When it's done you get a URL like
   `impulse-reports.vercel.app` — open it on your phone, sign in with the
   user from step 1.4, and you should see the example job.

### 3. Put it on your home screen

On your phone open the site in Safari/Chrome → Share → **Add to Home
Screen**. It installs like an app (standalone, navy splash, bolt icon).

### 4. Email reports (optional, recommended)

1. Create a free account at [resend.com](https://resend.com) →
   **Domains → Add domain** → add `impulseelectrical.com.au` and add the DNS
   records it shows you (at your domain registrar). Wait for "Verified".
2. **API Keys → Create API key** (Sending access is enough).
3. In Vercel → your project → **Settings → Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the key from step 2 |
   | `REPORT_FROM_EMAIL` | e.g. `reports@impulseelectrical.com.au` |

4. **Deployments → ⋯ → Redeploy** so the new variables take effect.

Until you do this, "Email report" shows a friendly "not configured" message
and Download PDF works regardless.

---

## Local development

```bash
cd impulse-reports
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

There's also a full end-to-end harness that needs **no real Supabase** — see
[`.claude/skills/verify/SKILL.md`](.claude/skills/verify/SKILL.md). In short:
`node e2e/mock-supabase.mjs` starts an in-memory Supabase mock, and
`node e2e/drive.mjs` drives every flow (login, autosave, offline photo queue,
signature, PDF) in headless Chromium.

## Where things live

```
app/                        pages & API routes
  page.tsx                  login
  jobs/                     job list, job editor, boards, variations
  settings/                 business details, logo, default checklist
  api/report/[jobId]/       GET = PDF download, /email POST = send via Resend
components/                 client components (autosave forms, photos, signature pad)
lib/
  supabase/                 browser + server clients (@supabase/ssr)
  pdf/                      report builder (pdf-lib) + data loading
  upload-queue.ts           IndexedDB offline photo queue
  compress.ts               client-side image compression
  legal.ts                  variation authorisation wording  ← solicitor review!
proxy.ts                    auth gate + session refresh (Next 16 proxy)
supabase/migrations/        schema + seed SQL
e2e/                        mock Supabase + Playwright drive script
```

## Notes

- All storage buckets are **private**; the app uses short-lived signed URLs.
- Job/board/photo/variation changes bump the parent job's `updated_at`
  (trigger), so the jobs list orders by real activity.
- The PDF uses built-in Helvetica (no font downloads) and renders photos two
  per row; anything Helvetica can't encode is stripped rather than crashing.
