import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { business, services } from "@/lib/data";
import { Icon } from "@/components/icons";
import { CtaBand, ServiceCard, TrustBar } from "@/components/sections";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: `${service.title} Mornington Peninsula`,
    description: `${service.short} Local A-Grade electricians, REC 25266. Call ${business.phone}.`,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 4);

  return (
    <>
      <section className="bg-navy text-white">
        <div className="container-site py-14 sm:py-20">
          <nav className="text-sm text-white/60" aria-label="Breadcrumb">
            <Link href="/services" className="hover:text-brand">
              Services
            </Link>{" "}
            / <span className="text-white/90">{service.title}</span>
          </nav>
          <div className="mt-4 flex items-start gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/20 text-brand sm:flex">
              <Icon name={service.icon} className="h-7 w-7" />
            </span>
            <div>
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
                {service.title}
              </h1>
              <p className="mt-2 text-lg text-white/75">
                Mornington Peninsula · Frankston to Portsea
              </p>
            </div>
          </div>
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

      <section className="container-site grid gap-12 py-16 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-lg leading-relaxed text-navy/80">{service.hero}</p>

          <h2 className="mt-10 text-2xl font-extrabold">What’s included</h2>
          <ul className="mt-5 space-y-3.5">
            {service.points.map((p) => (
              <li key={p} className="flex gap-3">
                <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <span className="leading-relaxed text-navy/80">{p}</span>
              </li>
            ))}
          </ul>

          {service.faq && service.faq.length > 0 && (
            <>
              <h2 className="mt-12 text-2xl font-extrabold">Common questions</h2>
              <div className="mt-5 space-y-4">
                {service.faq.map((f) => (
                  <details key={f.q} className="card group p-5 open:border-brand/40">
                    <summary className="cursor-pointer list-none font-bold marker:content-none">
                      <span className="flex items-center justify-between gap-4">
                        {f.q}
                        <span className="text-brand transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 leading-relaxed text-navy/70">{f.a}</p>
                  </details>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="card bg-navy p-6 text-white">
            <h3 className="text-lg font-bold">Get it sorted today</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Call for a straight answer and an up-front price, any day of the
              week.
            </p>
            <a href={business.phoneHref} className="btn-primary mt-4 w-full">
              <Icon name="phone" className="h-5 w-5" />
              {business.phone}
            </a>
            <Link href="/contact" className="btn-outline-light mt-3 w-full">
              Request a quote
            </Link>
          </div>
          <div className="card p-6">
            <h3 className="font-bold">Licensed &amp; insured</h3>
            <ul className="mt-3 space-y-2 text-sm text-navy/70">
              <li>{business.rec}</li>
              <li>{business.licence}</li>
              <li>{business.insurance}</li>
              <li>Certificate of Electrical Safety issued</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="border-t border-gray-200 bg-gray-50">
        <div className="container-site py-16">
          <h2 className="text-2xl font-extrabold">Other services</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
