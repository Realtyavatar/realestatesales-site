import type { Metadata } from "next";
import {
  CtaBand,
  EmergencyStrip,
  PageHero,
  ServicesIndex,
  TrustLine,
} from "@/components/sections";

export const metadata: Metadata = {
  title: "Electrical Services",
  description:
    "Residential, commercial, switchboard upgrades, EV chargers, lighting and 24/7 emergency electrical services across the Mornington Peninsula. REC 25266.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        kicker="Services"
        title="Everything electrical, done once and done right"
        lede="Residential and commercial work across the Peninsula by A-Grade licensed electricians. Priced before we start, certified when we finish."
      />
      <TrustLine />
      <ServicesIndex title="The list" />
      <EmergencyStrip />
      <CtaBand
        title="Not sure what you need?"
        text="Describe the problem and we’ll point you the right way — no obligation, no jargon."
      />
    </>
  );
}
