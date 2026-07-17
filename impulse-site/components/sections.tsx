import Link from "next/link";
import { business, services, type Service } from "@/lib/data";

/* Shared building blocks, van-signage style: hairline rules, condensed caps,
   no decorative icons. */

export function PageHero({
  kicker,
  title,
  lede,
  crumb,
  cta = true,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  crumb?: { href: string; label: string };
  cta?: boolean;
}) {
  return (
    <section className="border-b border-line">
      <div className="container-site py-12 sm:py-16">
        {crumb && (
          <nav aria-label="Breadcrumb" className="mb-4 font-condensed text-base font-semibold uppercase tracking-[0.12em] text-mute">
            <Link href={crumb.href} className="hover:text-brand">
              {crumb.label}
            </Link>{" "}
            <span aria-hidden>/</span>
          </nav>
        )}
        {kicker && !crumb && <p className="kicker mb-3">{kicker}</p>}
        <h1 className="display max-w-4xl text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
        {lede && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mute">{lede}</p>}
        {cta && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href={business.phoneHref} className="btn-primary">
              Call {business.phone}
            </a>
            <Link href="/contact" className="btn-ghost">
              Get a quote
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function TrustLine() {
  const items = [
    business.rec,
    business.licence,
    business.insurance,
    "Certificate of Electrical Safety, every job",
  ];
  return (
    <div className="border-b border-line bg-panel">
      <div className="container-site flex flex-wrap gap-x-8 gap-y-1.5 py-3.5">
        {items.map((t) => (
          <span key={t} className="font-condensed text-[15px] font-semibold uppercase tracking-[0.1em] text-mute">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ServiceRow({ service, index }: { service: Service; index: number }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-t border-line py-6 transition-colors hover:bg-panel sm:grid-cols-[4rem_16rem_1fr_auto] sm:gap-6"
    >
      <span className="font-condensed text-lg font-semibold text-mute/60" aria-hidden>
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="display text-2xl sm:text-3xl group-hover:text-brand">{service.title}</h3>
      <p className="col-span-2 col-start-2 text-[15px] leading-snug text-mute sm:col-span-1 sm:col-start-3 sm:max-w-md">
        {service.short}
      </p>
      <span className="hidden font-condensed text-xl text-brand sm:block" aria-hidden>
        →
      </span>
    </Link>
  );
}

export function ServicesIndex({ title = "What we do" }: { title?: string }) {
  return (
    <section className="container-site py-14 sm:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="display text-4xl sm:text-5xl">{title}</h2>
        <p className="hidden pb-1 font-condensed text-base font-semibold uppercase tracking-[0.12em] text-mute sm:block">
          Fixed quotes · No call-out surprises
        </p>
      </div>
      <div className="border-b border-line">
        {services.map((s, i) => (
          <ServiceRow key={s.slug} service={s} index={i} />
        ))}
      </div>
    </section>
  );
}

export function EmergencyStrip() {
  return (
    <section>
      <div className="hazard" aria-hidden />
      <div className="bg-navy">
        <div className="container-site flex flex-col justify-between gap-5 py-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="display text-3xl text-white sm:text-4xl">
              No power? Board tripping? Burning smell?
            </h2>
            <p className="mt-1 font-condensed text-lg font-semibold uppercase tracking-[0.1em] text-white/60">
              24 hours, 7 days, whole Peninsula
            </p>
          </div>
          <a href={business.phoneHref} className="btn-primary whitespace-nowrap !text-xl">
            {business.phone}
          </a>
        </div>
      </div>
    </section>
  );
}

export function CtaBand({
  title = "Tell us about the job",
  text = "Straight answer on the phone, price before we start. Or send the details and we’ll ring you back.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="border-t border-line">
      <div className="container-site grid gap-8 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="display text-4xl sm:text-5xl">{title}</h2>
          <p className="mt-3 max-w-md text-lg leading-relaxed text-mute">{text}</p>
        </div>
        <div className="lg:justify-self-end">
          <a href={business.phoneHref} className="phone-lockup block text-6xl leading-none text-ink transition hover:text-brand sm:text-7xl">
            {business.phone}
          </a>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href="/contact" className="btn-ghost">
              Request a quote
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
