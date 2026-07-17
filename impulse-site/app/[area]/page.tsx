import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  areaPath,
  business,
  services,
  suburbs,
  suburbFromAreaSlug,
} from "@/lib/data";
import {
  CtaBand,
  PageHero,
  ServiceRow,
  TrustLine,
} from "@/components/sections";

// Suburb landing pages at /electrician-<suburb> — the exact URLs the old
// site ranks with on Google, so existing rankings carry over 1:1 with no
// redirects. Titles intentionally match the old pages' title format too.

// The old site also ranks for /electrician-mornington-peninsula as its own
// page, so it renders here as a region-wide landing page.
const REGION_SLUG = "electrician-mornington-peninsula";
const REGION_NAME = "Mornington Peninsula";

function resolveSuburb(area: string): string | undefined {
  if (area === REGION_SLUG) return REGION_NAME;
  return suburbFromAreaSlug(area);
}

export function generateStaticParams() {
  return [
    ...suburbs.map((s) => ({ area: areaPath(s).slice(1) })),
    { area: REGION_SLUG },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area } = await params;
  const suburb = resolveSuburb(area);
  if (!suburb) return {};
  return {
    title: {
      absolute: `Electrician ${suburb} | Impulse Electrical Contractors`,
    },
    description: `Local A-Grade electrician servicing ${suburb} — residential, commercial, switchboards, EV chargers and 24/7 emergency call-outs. REC 25266. Call ${business.phone}.`,
    alternates: { canonical: `/${area}` },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area } = await params;
  const suburb = resolveSuburb(area);
  if (!suburb) {
    // An old suburb URL we don't have a page for shouldn't dead-end — send
    // it to the areas index (301) so any link equity it has is kept.
    if (area.startsWith("electrician-")) permanentRedirect("/areas");
    notFound();
  }

  // Neighbouring suburbs = the closest entries in the (roughly geographic)
  // list; the region-wide page links a spread of suburbs instead.
  const idx = suburbs.indexOf(suburb);
  const nearby =
    idx === -1
      ? suburbs.filter((_, i) => i % 5 === 0)
      : suburbs.slice(Math.max(0, idx - 3), idx + 4).filter((s) => s !== suburb);

  return (
    <>
      <PageHero
        crumb={{ href: "/areas", label: "Service areas" }}
        title={`Electrician ${suburb}`}
        lede={`Need an electrician in ${suburb}? We’re Peninsula-based and in your area every week — everyday electrical work, bigger projects, and genuine 24/7 emergency call-outs.`}
      />
      <TrustLine />

      <section className="container-site py-14 sm:py-16">
        <div className="max-w-3xl">
          <h2 className="display text-4xl sm:text-5xl">What we do in {suburb}</h2>
          <p className="mt-4 text-lg leading-relaxed text-mute">
            Every job is done by an A-Grade licensed electrician ({business.rec}
            ), covered by {business.insurance.toLowerCase()}, and finished with
            a Certificate of Electrical Safety. Because we’re local you’re not
            paying Melbourne travel time — and when something urgent happens we
            can actually get to {suburb} fast.
          </p>
        </div>
        <div className="mt-10 border-b border-line">
          {services.map((s, i) => (
            <ServiceRow key={s.slug} service={s} index={i} />
          ))}
        </div>
      </section>

      {nearby.length > 0 && (
        <section className="bg-panel">
          <div className="container-site py-10">
            <h2 className="font-condensed text-base font-semibold uppercase tracking-[0.14em] text-mute">
              We also service
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
              {nearby.map((s) => (
                <li key={s}>
                  <Link
                    href={areaPath(s)}
                    className="font-condensed text-xl font-semibold text-ink transition hover:text-brand"
                  >
                    {s}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/areas" className="font-condensed text-xl font-semibold text-brand">
                  All areas →
                </Link>
              </li>
            </ul>
          </div>
        </section>
      )}

      <CtaBand
        title={`Need an electrician in ${suburb}?`}
        text="Realistic ETA and an up-front price on the phone, or send the job details for a quote."
      />
    </>
  );
}
