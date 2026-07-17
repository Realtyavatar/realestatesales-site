import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  business,
  services,
  suburbs,
  suburbFromSlug,
  suburbSlug,
} from "@/lib/data";
import { Icon } from "@/components/icons";
import { CtaBand, ServiceCard, TrustBar } from "@/components/sections";

export function generateStaticParams() {
  return suburbs.map((s) => ({ slug: suburbSlug(s) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const suburb = suburbFromSlug(slug);
  if (!suburb) return {};
  return {
    title: `Electrician ${suburb}`,
    description: `Local A-Grade electrician servicing ${suburb} — residential, commercial, switchboards, EV chargers and 24/7 emergency call-outs. REC 25266. Call ${business.phone}.`,
    alternates: { canonical: `/areas/${slug}` },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const suburb = suburbFromSlug(slug);
  if (!suburb) notFound();

  // Neighbouring suburbs = the closest entries in the (roughly geographic) list.
  const idx = suburbs.indexOf(suburb);
  const nearby = suburbs
    .slice(Math.max(0, idx - 3), idx + 4)
    .filter((s) => s !== suburb);

  return (
    <>
      <section className="bg-navy text-white">
        <div className="container-site py-14 sm:py-20">
          <nav className="text-sm text-white/60" aria-label="Breadcrumb">
            <Link href="/areas" className="hover:text-brand">
              Service areas
            </Link>{" "}
            / <span className="text-white/90">{suburb}</span>
          </nav>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Electrician {suburb}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            Need an electrician in {suburb}? Impulse Electrical Contractors is
            Peninsula-based and on the road in your area every week — for
            everyday electrical work, bigger projects, and genuine 24/7
            emergency call-outs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={business.phoneHref} className="btn-primary">
              <Icon name="phone" className="h-5 w-5" />
              Call {business.phone}
            </a>
            <Link href="/contact" className="btn-outline-light">
              Get a free quote
            </Link>
          </div>
        </div>
      </section>

      <TrustBar />

      <section className="container-site py-16">
        <div className="max-w-3xl">
          <h2 className="section-title">
            What we do in {suburb}
          </h2>
          <p className="mt-4 leading-relaxed text-navy/70">
            Every job is done by an A-Grade licensed electrician (
            {business.rec}), covered by {business.insurance.toLowerCase()}, and
            finished with a Certificate of Electrical Safety. Because we’re
            local, you’re not paying for travel time from Melbourne — and when
            something urgent happens, we can actually get to {suburb} fast.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </section>

      {nearby.length > 0 && (
        <section className="border-t border-gray-200 bg-gray-50">
          <div className="container-site py-12">
            <h2 className="text-xl font-extrabold">We also service</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {nearby.map((s) => (
                <Link
                  key={s}
                  href={`/areas/${suburbSlug(s)}`}
                  className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-navy/80 transition hover:border-brand hover:text-brand"
                >
                  {s}
                </Link>
              ))}
              <Link
                href="/areas"
                className="rounded-full border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand"
              >
                All areas →
              </Link>
            </div>
          </div>
        </section>
      )}

      <CtaBand
        title={`Need an electrician in ${suburb}?`}
        text="Call now for a realistic ETA and an up-front price, or send through the job details for a free quote."
      />
    </>
  );
}
