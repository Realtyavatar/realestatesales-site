import type { Metadata } from "next";
import { CtaBand, EmergencyStrip, ServicesGrid } from "@/components/sections";

export const metadata: Metadata = {
  title: "Electrical Services",
  description:
    "Residential, commercial, switchboard upgrades, EV chargers, lighting and 24/7 emergency electrical services across the Mornington Peninsula. REC 25266.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="container-site py-14 sm:py-20">
          <p className="eyebrow">Services</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Everything electrical, done once and done right
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Residential and commercial work across the Mornington Peninsula by
            A-Grade licensed electricians — with a Certificate of Electrical
            Safety on every job.
          </p>
        </div>
      </section>
      <ServicesGrid heading={false} />
      <EmergencyStrip />
      <CtaBand title="Not sure which service you need?" text="Describe the problem and we'll point you in the right direction — no obligation, no jargon." />
    </>
  );
}
