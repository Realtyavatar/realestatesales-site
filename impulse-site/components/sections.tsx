import Link from "next/link";
import { business, services, type Service } from "@/lib/data";
import { Icon } from "./icons";

export function TrustBar() {
  const items = [
    { icon: "shield", label: business.rec },
    { icon: "check", label: business.licence },
    { icon: "star", label: business.insurance },
    { icon: "clock", label: "24/7 emergency call-outs" },
  ];
  return (
    <div className="border-y border-gray-200 bg-gray-50">
      <div className="container-site grid grid-cols-2 gap-x-4 gap-y-3 py-5 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2.5 text-sm font-semibold text-navy/80">
            <Icon name={it.icon} className="h-5 w-5 shrink-0 text-brand" />
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="card group flex flex-col gap-3 p-6 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon name={service.icon} className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-bold group-hover:text-brand">{service.title}</h3>
      <p className="text-sm leading-relaxed text-navy/70">{service.short}</p>
      <span className="mt-auto text-sm font-semibold text-brand">Learn more →</span>
    </Link>
  );
}

export function ServicesGrid({ heading = true }: { heading?: boolean }) {
  return (
    <section className="container-site py-16 sm:py-20">
      {heading && (
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow">What we do</p>
          <h2 className="section-title mt-2">
            Every electrical job, from a power point to a full fit-out
          </h2>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <ServiceCard key={s.slug} service={s} />
        ))}
      </div>
    </section>
  );
}

export function EmergencyStrip() {
  return (
    <section className="bg-brand">
      <div className="container-site flex flex-col items-center justify-between gap-4 py-6 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-3 text-white">
          <Icon name="alert" className="h-8 w-8 shrink-0" />
          <p className="text-lg font-bold sm:text-xl">
            Electrical emergency? We answer 24 hours a day, 7 days a week.
          </p>
        </div>
        <a href={business.phoneHref} className="btn bg-white text-brand hover:bg-gray-100 whitespace-nowrap">
          <Icon name="phone" className="h-5 w-5" />
          {business.phone}
        </a>
      </div>
    </section>
  );
}

export function CtaBand({
  title = "Ready to get started?",
  text = "Call for a straight answer and a free quote, or send through the details and we'll get back to you fast.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="bg-navy">
      <div className="container-site flex flex-col items-center gap-6 py-16 text-center">
        <h2 className="section-title max-w-2xl text-white">{title}</h2>
        <p className="max-w-xl text-white/70">{text}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={business.phoneHref} className="btn-primary">
            <Icon name="phone" className="h-5 w-5" />
            Call {business.phone}
          </a>
          <Link href="/contact" className="btn-outline-light">
            Request a free quote
          </Link>
        </div>
      </div>
    </section>
  );
}
