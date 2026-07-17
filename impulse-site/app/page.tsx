import Link from "next/link";
import { areaPath, business, reviews, suburbs } from "@/lib/data";
import { Icon } from "@/components/icons";
import {
  CtaBand,
  EmergencyStrip,
  ServicesGrid,
  TrustBar,
} from "@/components/sections";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand/20 blur-3xl"
        />
        <div className="container-site relative py-20 sm:py-28">
          <p className="eyebrow">Mornington Peninsula · Frankston to Portsea</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Your local electrician,{" "}
            <span className="text-brand">on time and on the Peninsula.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Impulse Electrical Contractors has spent {business.yearsExperience}{" "}
            looking after Peninsula homes and businesses — from a single power
            point to full commercial fit-outs, with a genuine 24/7 emergency
            call-out service when things go wrong.
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
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white/80">
            {[business.rec, business.licence, business.insurance].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 text-brand" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TrustBar />
      <ServicesGrid />
      <EmergencyStrip />

      {/* Why us */}
      <section className="container-site grid items-start gap-12 py-16 sm:py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Why Impulse</p>
          <h2 className="section-title mt-2">
            The electrician your neighbours already use
          </h2>
          <p className="mt-4 leading-relaxed text-navy/70">
            We’re not a franchise call centre in Melbourne — we live and work on
            the Peninsula. That means honest advice, realistic ETAs, no travel
            surcharges from the city, and a name you’ll see again next time you
            need us.
          </p>
          <div className="mt-8 space-y-5">
            {[
              {
                title: "Straight answers, up-front pricing",
                text: "You'll know what it costs and why before any work starts — and if something can safely wait, we'll tell you.",
              },
              {
                title: "A-Grade licensed, fully insured",
                text: `${business.licence}, ${business.rec}, ${business.insurance}. A Certificate of Electrical Safety comes with every job.`,
              },
              {
                title: "Tidy, on time, done properly",
                text: "We turn up when we say we will, do the job to standard, and leave the site cleaner than we found it.",
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon name="check" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy/70">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-gray-50 p-8">
          <h3 className="text-lg font-bold">How it works</h3>
          <ol className="mt-6 space-y-6">
            {[
              {
                step: "1",
                title: "Call or send an enquiry",
                text: `Ring ${business.phone} any time — emergencies included — or use the quote form and we'll call you back.`,
              },
              {
                step: "2",
                title: "Clear quote, no surprises",
                text: "We scope the job, explain the options in plain English and give you the price before we start.",
              },
              {
                step: "3",
                title: "Job done, certificate issued",
                text: "Work completed to Australian standards, site left spotless, Certificate of Electrical Safety in your hand.",
              },
            ].map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white">
                  {s.step}
                </span>
                <div>
                  <h4 className="font-bold">{s.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-navy/70">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          {reviews[0] && (
            <blockquote className="mt-8 border-l-4 border-brand pl-4">
              <div className="flex gap-0.5 text-brand" aria-label="5 star review">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-2 text-sm italic leading-relaxed text-navy/80">
                “{reviews[0].quote}”
              </p>
              <footer className="mt-1 text-xs text-navy/50">{reviews[0].source}</footer>
            </blockquote>
          )}
        </div>
      </section>

      {/* Service area */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="container-site py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Where we work</p>
            <h2 className="section-title mt-2">
              Covering the whole Mornington Peninsula
            </h2>
            <p className="mt-4 leading-relaxed text-navy/70">
              Based in {business.locality} and on the road across the Peninsula
              every day — {business.serviceAreaBlurb.toLowerCase()}.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {suburbs.map((s) => (
              <Link
                key={s}
                href={areaPath(s)}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-navy/80 transition hover:border-brand hover:text-brand"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
