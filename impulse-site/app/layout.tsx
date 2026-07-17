import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyCallBar from "@/components/StickyCallBar";
import { business, suburbs } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: new URL(business.baseUrl),
  title: {
    default: `Electrician Mornington Peninsula | ${business.name}`,
    template: `%s | ${business.shortName}`,
  },
  description:
    "Local A-Grade electricians serving the Mornington Peninsula for 10+ years. Residential, commercial, switchboards, EV chargers and genuine 24/7 emergency call-outs. REC 25266. Call 0418 383 232.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: business.name,
    title: `Electrician Mornington Peninsula | ${business.name}`,
    description:
      "Local A-Grade electricians serving the Mornington Peninsula. 24/7 emergency call-outs. REC 25266.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b2545",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Electrician",
  name: business.name,
  url: business.baseUrl,
  telephone: "+61418383232",
  email: business.email,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: business.locality,
    addressRegion: business.region,
    postalCode: business.postcode,
    addressCountry: "AU",
  },
  areaServed: suburbs.map((s) => ({ "@type": "City", name: `${s}, VIC` })),
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "00:00",
    closes: "23:59",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <StickyCallBar />
      </body>
    </html>
  );
}
