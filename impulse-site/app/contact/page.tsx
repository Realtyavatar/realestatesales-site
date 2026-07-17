import type { Metadata } from "next";
import { business } from "@/lib/data";
import { PageHero, TrustLine } from "@/components/sections";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact & Free Quotes",
  description: `Call ${business.phone} (24/7) or request a free quote online. Impulse Electrical Contractors — Mornington Peninsula electricians, REC 25266.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Get a quote"
        lede="Call any time — including emergencies — or send the details through and we’ll ring you back."
        cta={false}
      />
      <TrustLine />

      <section className="container-site grid gap-12 py-14 sm:py-16 lg:grid-cols-[20rem_1fr]">
        <div>
          <h2 className="font-condensed text-base font-semibold uppercase tracking-[0.14em] text-mute">
            Phone — 24/7 for emergencies
          </h2>
          <a href={business.phoneHref} className="phone-lockup mt-2 block text-5xl text-ink transition hover:text-brand">
            {business.phone}
          </a>

          <h2 className="mt-8 font-condensed text-base font-semibold uppercase tracking-[0.14em] text-mute">
            Email
          </h2>
          <a href={`mailto:${business.email}`} className="mt-2 block break-all text-lg font-medium text-ink transition hover:text-brand">
            {business.email}
          </a>

          <h2 className="mt-8 font-condensed text-base font-semibold uppercase tracking-[0.14em] text-mute">
            Service area
          </h2>
          <p className="mt-2 text-ink">{business.serviceAreaBlurb}</p>

          <ul className="mt-8 space-y-1.5 border-t border-line pt-5 font-condensed text-[15px] font-semibold uppercase tracking-[0.08em] text-mute">
            <li>{business.name}</li>
            <li>{business.rec}</li>
            <li>{business.licence}</li>
            <li>{business.insurance}</li>
          </ul>
        </div>

        <div className="border-2 border-ink p-6 sm:p-8">
          <h2 className="display text-3xl">Request a quote</h2>
          <p className="mb-6 mt-1 text-sm text-mute">Fields marked * are required.</p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
