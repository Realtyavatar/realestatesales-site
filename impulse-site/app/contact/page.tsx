import type { Metadata } from "next";
import { business } from "@/lib/data";
import { Icon } from "@/components/icons";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact & Free Quotes",
  description: `Call ${business.phone} (24/7) or request a free quote online. Impulse Electrical Contractors — Mornington Peninsula electricians, REC 25266.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="container-site py-14 sm:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Get a free quote
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Call any time — including emergencies — or send the details through
            and we’ll get back to you fast.
          </p>
        </div>
      </section>

      <section className="container-site grid gap-12 py-16 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
          <a href={business.phoneHref} className="card flex items-center gap-4 p-6 transition hover:border-brand">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon name="phone" className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy/60">
                Call us — 24/7 for emergencies
              </span>
              <span className="block text-xl font-extrabold">{business.phone}</span>
            </span>
          </a>
          <a href={`mailto:${business.email}`} className="card flex items-center gap-4 p-6 transition hover:border-brand">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon name="mail" className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy/60">Email</span>
              <span className="block text-lg font-extrabold break-all">{business.email}</span>
            </span>
          </a>
          <div className="card flex items-center gap-4 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon name="pin" className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy/60">Service area</span>
              <span className="block font-bold">{business.serviceAreaBlurb}</span>
            </span>
          </div>
          <div className="card bg-gray-50 p-6 text-sm leading-relaxed text-navy/70">
            <p className="font-bold text-navy">{business.name}</p>
            <p className="mt-1">
              {business.rec} · {business.licence}
            </p>
            <p>{business.insurance}</p>
          </div>
        </div>

        <div className="card p-6 sm:p-8 lg:col-span-3">
          <h2 className="text-xl font-extrabold">Request a quote</h2>
          <p className="mt-1 mb-6 text-sm text-navy/60">
            Fields marked * are required.
          </p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
