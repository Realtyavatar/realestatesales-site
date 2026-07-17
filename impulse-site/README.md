# Impulse Electrical — Marketing Site

A rebuilt, modern marketing website for **Impulse Electrical Contractors**
(Mornington Peninsula, REC 25266), replacing the old site at
impulseelectrical.com.au / electrician-morningtonpeninsula.com.au.

**Stack:** Next.js 16 (App Router) + Tailwind CSS 4. Fully static apart from
the enquiry API route — no database. Deploys to Vercel.

> This app lives in the `impulse-site/` subdirectory of the repo and is
> completely independent of everything else here. On Vercel, point the
> project's **Root Directory** at `impulse-site`.

## What's inside

- **Home** — hero, trust bar (REC / A-Grade licence / $25M insurance / 24-7),
  services grid, why-us + how-it-works, review, suburb chips, CTA band.
- **8 service pages** (`/services/[slug]`) — emergency call-outs, switchboard
  upgrades, EV chargers, lighting, outdoor lighting, commercial, residential,
  safety inspections. Each with intro copy, inclusions, FAQs and sidebar CTA.
- **35 suburb/region pages** (`/electrician-[suburb]`) — local-SEO landing
  pages for every Peninsula suburb (Frankston to Portsea) plus
  `/electrician-mornington-peninsula`, generated from one list in
  `lib/data.ts`, cross-linked to geographic neighbours. **The URLs
  deliberately match the old site 1:1** — see "Keeping your rankings".
- **About** and **Contact** — contact page has click-to-call/email cards and
  a quote form.
- **SEO** — per-page titles/descriptions/canonicals, `sitemap.xml`,
  `robots.txt`, LocalBusiness (`Electrician`) JSON-LD with all suburbs as
  `areaServed`, Open Graph tags.
- **Mobile-first** — sticky call/quote bar on phones, big touch targets, no
  external fonts/images/scripts (fast Core Web Vitals by construction).

## Editing content

All copy that matters lives in **`lib/data.ts`**: phone/email/licence
details, the services (with FAQs), the suburb list, and reviews. Add a new
suburb or service there and its page, sitemap entry and nav links appear
automatically.

## Enquiry form email

The quote form posts to `/api/enquire`, which sends the enquiry to
`info@impulseelectrical.com.au` via [Resend](https://resend.com) — the same
provider the Impulse Reports app uses, so the verified
`impulseelectrical.com.au` domain can be shared.

Set these environment variables on Vercel:

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | your Resend API key |
| `ENQUIRY_TO_EMAIL` | optional, defaults to `info@impulseelectrical.com.au` |
| `ENQUIRY_FROM_EMAIL` | optional, defaults to `website@impulseelectrical.com.au` |

Until the key is set, the form shows a friendly "call us instead" error —
enquiries are never silently dropped.

## Keeping your rankings (read before launch)

The existing Google rankings belong to
**electrician-morningtonpeninsula.com.au** and its exact URLs. The site is
built so launch changes *neither*:

1. **Same domain.** Deploy the new site on
   `electrician-morningtonpeninsula.com.au` (it's the default `baseUrl` in
   `lib/data.ts`). Don't move to `impulseelectrical.com.au` as the primary
   domain at the same time as the redesign — a domain migration is the only
   genuinely risky part, and it's entirely optional. Keep
   `impulseelectrical.com.au` doing whatever it does today (redirecting is
   fine).
2. **Same URLs.** The pages that rank keep their exact addresses:
   - `/electrician-<suburb>` (all suburb pages, top-level, no `/areas/` prefix)
   - `/electrician-mornington-peninsula`
   - `/services/outdoor-lighting`, `/services/commercial-electrical`
   - `/how-to-choose-the-right-electrician-on-the-mornington-peninsula`
   - `/` — same target keyword ("electrician Mornington Peninsula") in title + H1
3. **Redirects for the rest.** Old URLs with no 1:1 equivalent get a 301 in
   `next.config.ts` (`legacyRedirects`) — e.g. the old 24-hour call-out page
   now points at `/services/emergency-electrician`. Unknown
   `/electrician-*` URLs 301 to `/areas` instead of 404ing.

**Before flipping DNS:**

- Crawl the old site (Screaming Frog free tier, or Search Console → Pages →
  export) and check every indexed URL against the new site. Anything that
  404s goes into `legacyRedirects` in `next.config.ts`.
- Note the old pages' `<title>`s for any URL that ranks well; keep the same
  primary keyword in the new title if it differs.

**At launch:**

- Point the domain at the Vercel project. HTTPS and www/non-www
  normalisation are handled by Vercel automatically.
- In [Google Search Console](https://search.google.com/search-console)
  (verify the domain if it isn't already): submit `/sitemap.xml` and use
  **URL Inspection → Request indexing** on the homepage and top suburb pages.
- In your **Google Business Profile**, make sure the website link still
  points at the live domain.

**After launch:** watch Search Console's Performance + Pages reports for
2–4 weeks. A brief wobble while Google re-crawls is normal; 404s on
previously-indexed URLs are not — add redirects for any that appear.

**If you later migrate to impulseelectrical.com.au** (optional, do it months
after the redesign has settled): set `NEXT_PUBLIC_SITE_URL`, add the new
domain to the Vercel project, configure the old domain as a permanent
redirect (Vercel → Domains → Redirect, 308/301 — it preserves paths), keep
that redirect forever, and use Search Console's **Change of Address** tool.

## Deploying (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this
   repository.
2. Under **Root Directory**, click Edit and select `impulse-site`.
3. Add the environment variables above (optional, for the enquiry form).
4. Deploy, then attach `electrician-morningtonpeninsula.com.au`
   (Project → Settings → Domains) — see "Keeping your rankings" above.

## Local development

```bash
cd impulse-site
npm install
npm run dev   # http://localhost:3000
```
