import type { Metadata } from "next";
import { business, reviews } from "@/lib/data";
import { CtaBand, PageHero, TrustLine } from "@/components/sections";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Impulse Electrical Contractors — A-Grade licensed electricians based in Dromana, serving the Mornington Peninsula for over 10 years. REC 25266.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About"
        title="A local business built on turning up and doing it properly"
        cta={false}
      />
      <TrustLine />

      <section className="container-site grid gap-12 py-14 sm:py-16 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-ink">
          <p>
            Impulse Electrical Contractors is a {business.locality}-based
            electrical business that has spent more than ten years working
            across the Mornington Peninsula — in homes, shops, restaurants,
            strata buildings and light industrial sites from Frankston to
            Portsea.
          </p>
          <p>
            The reputation we’ve built comes down to simple things done
            consistently: we answer the phone, we turn up when we say we will,
            we explain the job and the price in plain English before we start,
            and we leave the site cleaner than we found it.
          </p>
          <p>
            Every job — big or small — is carried out by an A-Grade licensed
            electrician, backed by {business.insurance.toLowerCase()}, and
            finished with a Certificate of Electrical Safety. And because
            electrical faults don’t keep business hours, we run a genuine 24/7
            emergency call-out service for the whole Peninsula.
          </p>
          {reviews[0] && (
            <blockquote className="!mt-10 border-l-2 border-brand pl-6">
              <p className="display text-2xl normal-case tracking-normal sm:text-3xl">
                “{reviews[0].quote}”
              </p>
              <footer className="mt-3 font-condensed text-sm font-semibold uppercase tracking-[0.12em] text-mute">
                {reviews[0].source}
              </footer>
            </blockquote>
          )}
        </div>

        <aside>
          <div className="border-2 border-ink p-6">
            <h2 className="display text-2xl">Credentials</h2>
            <ul className="mt-4 space-y-2.5 border-t border-line pt-4 text-[15px] text-ink">
              <li>{business.rec}</li>
              <li>{business.licence}</li>
              <li>{business.insurance}</li>
              <li>Certificate of Electrical Safety with every job</li>
              <li>{business.yearsExperience} on the Mornington Peninsula</li>
            </ul>
          </div>
        </aside>
      </section>

      <CtaBand />
    </>
  );
}
