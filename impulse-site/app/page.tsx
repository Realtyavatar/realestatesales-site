import Link from "next/link";
import { areaPath, business, reviews, suburbs } from "@/lib/data";
import {
  CtaBand,
  EmergencyStrip,
  ServicesIndex,
  TrustLine,
} from "@/components/sections";

export default function HomePage() {
  return (
    <>
      {/* Hero — the phone number is the point */}
      <section className="border-b border-line">
        <div className="container-site py-14 sm:py-20">
          <p className="kicker mb-4">Frankston to Portsea · Est. 10+ years</p>
          <h1 className="display max-w-5xl text-6xl sm:text-7xl lg:text-8xl">
            Electrician,
            <br />
            Mornington <span className="text-brand">Peninsula.</span>
          </h1>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-xl text-lg leading-relaxed text-mute">
              Homes, shops and everything electrical in between. On time,
              priced before we start, Certificate of Electrical Safety with
              every job — and a phone that answers at 3am when the board won’t
              stop tripping.
            </p>
            <div className="lg:text-right">
              <a
                href={business.phoneHref}
                className="phone-lockup block text-6xl leading-none text-ink transition hover:text-brand sm:text-8xl"
              >
                {business.phone}
              </a>
              <p className="mt-2 font-condensed text-base font-semibold uppercase tracking-[0.14em] text-mute">
                Call any hour, any day
              </p>
            </div>
          </div>
        </div>
      </section>

      <TrustLine />
      <ServicesIndex title="What we do" />
      <EmergencyStrip />

      {/* How we work — blunt, three steps because there are three */}
      <section className="border-b border-line">
        <div className="container-site grid gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <h2 className="display text-4xl sm:text-5xl">
              No franchise, no call centre, no Melbourne travel bill
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">
              We live down here and work down here. The bloke who answers the
              phone is the one who turns up — with a realistic ETA, a price
              before the work starts, and a tidy site when it’s done. That’s
              the whole pitch.
            </p>
            {reviews[0] && (
              <blockquote className="mt-10 border-l-2 border-brand pl-6">
                <p className="display text-2xl normal-case tracking-normal sm:text-3xl">
                  “{reviews[0].quote}”
                </p>
                <footer className="mt-3 font-condensed text-sm font-semibold uppercase tracking-[0.12em] text-mute">
                  {reviews[0].source}
                </footer>
              </blockquote>
            )}
          </div>
          <div className="lg:pl-10">
            <ol>
              {[
                {
                  title: "Ring or send the job through",
                  text: `${business.phone}, any hour — or the quote form if it can wait.`,
                },
                {
                  title: "Price up front",
                  text: "We scope it, explain it in plain English, and you get the number before anything starts.",
                },
                {
                  title: "Done, certified, swept up",
                  text: "Work to Australian standards, Certificate of Electrical Safety in your hand, site cleaner than we found it.",
                },
              ].map((s, i) => (
                <li key={s.title} className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-line py-6 first:border-t-0 lg:first:border-t">
                  <span className="font-condensed text-4xl font-bold text-brand" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="display text-2xl">{s.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-mute">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Service area — plain typographic list */}
      <section className="bg-panel">
        <div className="container-site py-14 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-4xl sm:text-5xl">Where we work</h2>
            <p className="pb-1 font-condensed text-base font-semibold uppercase tracking-[0.12em] text-mute">
              Based {business.locality} · on the road daily
            </p>
          </div>
          <ul className="mt-8 columns-2 gap-8 sm:columns-3 lg:columns-4">
            {suburbs.map((s) => (
              <li key={s} className="mb-1.5 break-inside-avoid">
                <Link
                  href={areaPath(s)}
                  className="font-condensed text-xl font-semibold text-ink transition hover:text-brand"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
