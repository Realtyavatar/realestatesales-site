import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/lib/data";
import { CtaBand, PageHero } from "@/components/sections";

// This page keeps the old site's guide URL alive (it ranks in its own right)
// with fresh content on the same topic.

export const metadata: Metadata = {
  title: "How to Choose the Right Electrician on the Mornington Peninsula",
  description:
    "Licence checks, insurance, certificates and the questions worth asking — a practical guide to choosing an electrician on the Mornington Peninsula.",
  alternates: {
    canonical: "/how-to-choose-the-right-electrician-on-the-mornington-peninsula",
  },
};

const checks = [
  {
    title: "Check they’re licensed — and ask for the numbers",
    body: "In Victoria, electrical work must be done by a licensed electrician working for a Registered Electrical Contractor (REC). A legitimate sparkie will happily give you both numbers so you can verify them on the Energy Safe Victoria register. Ours are on every page of this site: REC 25266, A-Grade Licence A53308.",
  },
  {
    title: "Make sure they’re properly insured",
    body: "Public liability insurance protects you if something goes wrong on your property. Ask what cover the contractor carries — we hold $25 million in public liability insurance.",
  },
  {
    title: "Expect a Certificate of Electrical Safety",
    body: "Prescribed electrical work in Victoria must come with a Certificate of Electrical Safety (CES). It’s your proof the work was done and checked to standard — important for insurance and when you sell. If an electrician hesitates about issuing one, walk away. We issue a CES with every job.",
  },
  {
    title: "Get the price before the work starts",
    body: "A professional will scope the job, explain your options in plain English and give you a clear price up front — not a surprise invoice afterwards. Be wary of quotes that are dramatically cheaper than everyone else’s; corners get cut somewhere.",
  },
  {
    title: "Prefer local — it matters more than you’d think",
    body: "A Peninsula-based electrician gets to you faster (especially in an emergency), doesn’t bill Melbourne travel time, and relies on local word of mouth — which is the strongest incentive there is to do good work. We’re based in Dromana and work Frankston to Portsea every week.",
  },
  {
    title: "Read recent reviews and ask around",
    body: "Look for a pattern in reviews — punctuality, tidiness, communication — rather than a single score. On the Peninsula, asking neighbours who they use is still the best reference check going.",
  },
];

export default function GuidePage() {
  return (
    <>
      <PageHero
        kicker="Guide"
        title="How to choose the right electrician on the Mornington Peninsula"
        lede="Six checks that take five minutes and can save you thousands — whether you use us or anyone else."
        cta={false}
      />

      <section className="container-site max-w-3xl py-14 sm:py-16">
        <p className="text-lg leading-relaxed text-ink">
          Electrical work is one of the few trades where a bad job isn’t just
          annoying — it’s dangerous. The good news: sorting the professionals
          from the rest is straightforward if you know what to ask.
        </p>

        <ol className="mt-10 border-b border-line">
          {checks.map((c, i) => (
            <li key={c.title} className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-line py-7">
              <span className="font-condensed text-4xl font-bold text-brand" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h2 className="display text-2xl sm:text-3xl">{c.title}</h2>
                <p className="mt-2.5 leading-relaxed text-mute">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 border-2 border-ink p-8">
          <h2 className="display text-3xl">The short version</h2>
          <p className="mt-3 leading-relaxed text-mute">
            Licensed (with numbers you can check), insured, certificate with
            every job, price up front, local, and well reviewed. Impulse
            Electrical ticks all six — see{" "}
            <Link href="/services" className="font-semibold text-brand">
              what we do
            </Link>{" "}
            and{" "}
            <Link href="/areas" className="font-semibold text-brand">
              where we work
            </Link>
            , or call {business.phone} for a straight answer on any job.
          </p>
          <a href={business.phoneHref} className="btn-primary mt-6">
            Call {business.phone}
          </a>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
