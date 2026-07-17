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
- **34 suburb pages** (`/areas/[slug]`) — local-SEO landing pages for every
  Peninsula suburb (Frankston to Portsea), generated from one list in
  `lib/data.ts`, cross-linked to geographic neighbours.
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

## Deploying (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this
   repository.
2. Under **Root Directory**, click Edit and select `impulse-site`.
3. Add the environment variables above (optional, for the enquiry form).
4. Deploy, then point the `impulseelectrical.com.au` domain at the project
   (Project → Settings → Domains). Keep
   `electrician-morningtonpeninsula.com.au` as a redirect to preserve its
   existing Google rankings.

## Local development

```bash
cd impulse-site
npm install
npm run dev   # http://localhost:3000
```
