import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { business, services } from "@/lib/data";
import { CtaBand, PageHero, ServiceRow, TrustLine } from "@/components/sections";

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

  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHero
        crumb={{ href: "/services", label: "Services" }}
        title={service.title}
        lede={service.hero}
      />
      <TrustLine />

      <section className="container-site grid gap-12 py-14 sm:py-16 lg:grid-cols-[1fr_20rem]">
        <div>
          <h2 className="display text-3xl sm:text-4xl">What’s included</h2>
          <ul className="mt-6 border-b border-line">
            {service.points.map((p) => (
              <li key={p} className="grid grid-cols-[1.5rem_1fr] gap-3 border-t border-line py-4">
                <span className="font-condensed text-lg font-bold text-brand" aria-hidden>
                  —
                </span>
                <span className="leading-relaxed text-ink">{p}</span>
              </li>
            ))}
          </ul>

          {service.faq && service.faq.length > 0 && (
            <>
              <h2 className="display mt-14 text-3xl sm:text-4xl">Common questions</h2>
              <div className="mt-6 border-b border-line">
                {service.faq.map((f) => (
                  <details key={f.q} className="group border-t border-line py-5">
                    <summary className="cursor-pointer list-none marker:content-none">
                      <span className="flex items-baseline justify-between gap-4">
                        <span className="display text-xl sm:text-2xl">{f.q}</span>
                        <span className="font-condensed text-2xl text-brand transition group-open:rotate-45" aria-hidden>
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl leading-relaxed text-mute">{f.a}</p>
                  </details>
                ))}
              </div>
            </>
          )}
        </div>

        <aside>
          <div className="border-2 border-ink p-6">
            <h3 className="display text-2xl">Get it sorted</h3>
            <a href={business.phoneHref} className="phone-lockup mt-3 block text-4xl text-ink transition hover:text-brand">
              {business.phone}
            </a>
            <p className="mt-1 font-condensed text-sm font-semibold uppercase tracking-[0.12em] text-mute">
              Any day, any hour
            </p>
            <Link href="/contact" className="btn-ghost mt-5 w-full">
              Request a quote
            </Link>
            <ul className="mt-6 space-y-1.5 border-t border-line pt-5 font-condensed text-[15px] font-semibold uppercase tracking-[0.08em] text-mute">
              <li>{business.rec}</li>
              <li>{business.licence}</li>
              <li>{business.insurance}</li>
              <li>CES issued on completion</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="bg-panel">
        <div className="container-site py-14">
          <h2 className="display text-3xl sm:text-4xl">Other services</h2>
          <div className="mt-6 border-b border-line">
            {others.map((s, i) => (
              <ServiceRow key={s.slug} service={s} index={i} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
