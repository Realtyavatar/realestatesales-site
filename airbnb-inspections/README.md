# Airbnb Checkout Inspections

Mobile-first checkout inspection checklists for an Airbnb property. Built for
a phone in one hand while walking the property: big touch targets, autosave
on every tap, timestamped camera photos that survive signal dropouts, damage
flagging with severity levels, and one-tap PDF reports for record-keeping and
damage claims.

**Stack:** Next.js 16 (App Router) + Supabase (auth, Postgres, S3-backed
storage) + Tailwind CSS 4 + pdf-lib. Deploys to Vercel.

> This app lives in the `airbnb-inspections/` subdirectory of the repo and is
> completely independent of the site at the repo root (same pattern as
> `impulse-reports/`). On Vercel you point the project's **Root Directory** at
> `airbnb-inspections` (step-by-step below).

---

## What it does

- **Startup prompt** — when the app opens it asks you to begin a checkout
  inspection (once per session; there's also an always-visible button). Enter
  the property name/address and it creates the inspection with all rooms.
- **Rooms** — every inspection gets a Bedroom, Bathroom, Powder room,
  Kitchen, Living area, BBQ & outdoor area and Backyard, each with a
  checkout checklist tailored to it. Together they cover: cleanliness,
  linens changed, soap restocked, coffee and tea present, toilet paper
  stocked, appliances cleaned, bins emptied, BBQ cleaned and the backyard
  tidy. Tick items off with one tap — everything autosaves and syncs to the
  cloud as you go.
- **Timestamped photos** — take photos with the device camera (or pick from
  the gallery), multiple per room, optional captions. The capture date and
  time is **burned into the bottom-right corner of the image** and stored in
  the database, so every photo is self-evidently timestamped for damage
  reference. Photos are compressed on the phone (max 1600px JPEG) before
  upload. If the connection drops, photos queue in the browser's IndexedDB
  and retry automatically — nothing is lost, even if you close the tab.
- **Overall notes** — a free-text field on the inspection for anything worth
  recording; appears in the PDF.
- **Damage flags** — mark specific issues as damage with a severity (minor /
  moderate / severe), a description and notes. Flags can be scoped to a room
  or to the whole property. Every flag appears in the report's damage
  register automatically — it's derived, so it can't drift out of sync.
- **PDF report** — one tap: a timestamped report (generation date/time on the
  cover, in the footer of every page, and in the file name) with inspection
  details, overall notes, a section per room showing checklist results and
  photos (each captioned with its capture time), damage flagged per room, and
  a full damage register with severity levels.
- **Cloud sync** — all inspection data, photos and reports live in Supabase
  (Postgres for data, S3-backed Supabase Storage for photos), so you can sign
  in from any device — phone on-site, laptop at home — and see the same
  inspections. Storage is private; the app uses short-lived signed URLs.

## Assumptions made

- **Single user.** One login (you / your cleaner). Signups are disabled; all
  data belongs to the authenticated user. No roles, no sharing.
- **Supabase as the cloud service.** The brief suggested "Google Drive or AWS
  S3"; Supabase Storage *is* S3-backed object storage with auth and signed
  URLs built in, and it's the same service the other app in this repo already
  uses — one dashboard, one bill, no OAuth dance. If you specifically want
  reports pushed into a Google Drive folder later, that can be added as an
  export step.
- **Autosave over save buttons.** Checklist ticks, notes, damage flags and
  captions save ~1 second after you stop, and retry automatically on flaky
  data.
- **Checklists are per-room templates.** Each room shows the items that make
  sense for it (toilet paper in the bathroom, coffee in the kitchen). The
  templates live in `lib/rooms.ts` — edit that file to change them.
- **Photo timestamps use the phone's clock** at the moment the photo is added
  in the app (for camera captures that is the capture moment).
- **Photos are compressed to ~1600px JPEG.** Plenty for an A4 report and
  10–20× smaller on mobile data than raw phone photos.

---

## Deploying: Supabase + Vercel, step by step

You'll create a Supabase project (database + login + file storage), then a
Vercel project (the app itself). ~20 minutes.

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick any
   name (e.g. `airbnb-inspections`), a strong database password (save it
   somewhere), and the **Sydney** region.
2. When it finishes provisioning, open **SQL Editor** (left sidebar) →
   **New query**. Paste the entire contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and click **Run**. It creates the tables, security policies and the
   private `photos` storage bucket.
3. Create your login: **Authentication → Users → Add user → Create new
   user**. Use your email and a strong password, and tick **Auto Confirm
   User**.
4. Lock the door behind you: **Authentication → Sign In / Providers →
   Email** → turn **OFF** "Allow new users to sign up" → Save.
5. Grab your keys: **Project Settings → API Keys**. You need:
   - **Project URL** (like `https://abcd1234.supabase.co`)
   - **anon / public** key

### 2. Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   this GitHub repository.
2. **Important:** under **Root Directory**, click Edit and select
   `airbnb-inspections`. (Framework preset: Next.js — detected automatically.)
3. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from step 1.5 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key from step 1.5 |

4. Click **Deploy**. When it's done you get a URL like
   `airbnb-inspections.vercel.app` — open it on your phone and sign in with
   the user from step 1.3.

### 3. Put it on your home screen

On your phone open the site in Safari/Chrome → Share → **Add to Home
Screen**. It installs like an app (standalone, charcoal splash, house icon).

---

## Local development

```bash
cd airbnb-inspections
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

## Where things live

```
app/                          pages & API routes
  page.tsx                    login
  inspections/                inspection list (+ startup prompt), overview, rooms
  api/inspections/[id]/report GET = timestamped PDF download
components/                   client components (start prompt, checklists, photos, damage flags)
lib/
  rooms.ts                    room + checklist templates  ← edit to customise
  photo.ts                    client-side compression + timestamp burn-in
  upload-queue.ts             IndexedDB offline photo queue
  supabase/                   browser + server clients (@supabase/ssr)
  pdf/                        report builder (pdf-lib) + data loading
proxy.ts                      auth gate + session refresh (Next 16 proxy)
supabase/migrations/          schema SQL
```

## Notes

- The storage bucket is **private**; the app uses short-lived signed URLs.
- Room/photo/damage-flag changes bump the parent inspection's `updated_at`
  (trigger), so the list orders by real activity.
- The PDF uses built-in Helvetica (no font downloads) and renders photos two
  per row; anything Helvetica can't encode is stripped rather than crashing.
