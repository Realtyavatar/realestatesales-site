import type { Metadata } from "next";
import { business, reviews } from "@/lib/data";
import { Icon } from "@/components/icons";
import { CtaBand, TrustBar } from "@/components/sections";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Impulse Electrical Contractors — A-Grade licensed electricians based in Dromana, serving the Mornington Peninsula for over 10 years. REC 25266.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="container-site py-14 sm:py-20">
          <p className="eyebrow">About us</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            A local business built on turning up and doing it properly
          </h1>
        </div>
      </section>

      <TrustBar />

      <section className="container-site grid gap-12 py-16 lg:grid-cols-2">
        <div className="space-y-5 leading-relaxed text-navy/80">
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
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold">Credentials</h2>
            <ul className="mt-4 space-y-3 text-sm text-navy/80">
              {[
                business.rec,
                business.licence,
                business.insurance,
                "Certificate of Electrical Safety with every job",
                `${business.yearsExperience} on the Mornington Peninsula`,
              ].map((c) => (
                <li key={c} className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          {reviews[0] && (
            <blockquote className="card border-l-4 border-l-brand p-6">
              <div className="flex gap-0.5 text-brand" aria-label="5 star review">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-3 italic leading-relaxed text-navy/80">
                “{reviews[0].quote}”
              </p>
              <footer className="mt-2 text-xs text-navy/50">{reviews[0].source}</footer>
            </blockquote>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
