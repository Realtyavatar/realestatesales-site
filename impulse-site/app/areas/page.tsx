import type { Metadata } from "next";
import Link from "next/link";
import { areaPath, business, suburbs } from "@/lib/data";
import { CtaBand } from "@/components/sections";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Service Areas — Mornington Peninsula",
  description:
    "Impulse Electrical services the whole Mornington Peninsula, Frankston to Portsea — Mornington, Rosebud, Rye, Dromana, Sorrento, Hastings and everywhere in between.",
  alternates: { canonical: "/areas" },
};

export default function AreasPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="container-site py-14 sm:py-20">
          <p className="eyebrow">Service areas</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            On the road across the Peninsula every day
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Based in {business.locality}, we cover every suburb from Frankston
            to Portsea — for scheduled work and 24/7 emergencies alike.
          </p>
        </div>
      </section>

      <section className="container-site py-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suburbs.map((s) => (
            <Link
              key={s}
              href={areaPath(s)}
              className="card flex items-center gap-3 p-4 font-semibold transition hover:border-brand hover:text-brand"
            >
              <Icon name="pin" className="h-5 w-5 shrink-0 text-brand" />
              Electrician {s}
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm text-navy/60">
          Don’t see your suburb? If it’s on the Peninsula (or close to it),
          we’ll come to you — call {business.phone}.
        </p>
      </section>

      <CtaBand />
    </>
  );
}
