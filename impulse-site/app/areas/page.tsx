import type { Metadata } from "next";
import Link from "next/link";
import { areaPath, business, suburbs } from "@/lib/data";
import { CtaBand, PageHero, TrustLine } from "@/components/sections";

export const metadata: Metadata = {
  title: "Service Areas — Mornington Peninsula",
  description:
    "Impulse Electrical services the whole Mornington Peninsula, Frankston to Portsea — Mornington, Rosebud, Rye, Dromana, Sorrento, Hastings and everywhere in between.",
  alternates: { canonical: "/areas" },
};

export default function AreasPage() {
  return (
    <>
      <PageHero
        kicker="Service areas"
        title="On the road across the Peninsula every day"
        lede={`Based in ${business.locality}, covering every suburb from Frankston to Portsea — scheduled work and 24/7 emergencies alike.`}
      />
      <TrustLine />

      <section className="container-site py-14 sm:py-16">
        <ul className="columns-1 gap-8 sm:columns-2 lg:columns-3">
          {suburbs.map((s) => (
            <li key={s} className="break-inside-avoid">
              <Link
                href={areaPath(s)}
                className="group flex items-baseline justify-between gap-4 border-b border-line py-3 transition-colors hover:bg-panel"
              >
                <span className="display text-2xl group-hover:text-brand">
                  Electrician {s}
                </span>
                <span className="font-condensed text-lg text-brand opacity-0 transition group-hover:opacity-100" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-xl text-mute">
          Don’t see your suburb? If it’s on the Peninsula — or close to it —
          we’ll come to you. Call {business.phone}.
        </p>
      </section>

      <CtaBand />
    </>
  );
}
