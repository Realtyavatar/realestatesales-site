import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Real Estate Sales Australia — Buy, Sell & Rent Properties",
  description: "Find your next home with Real Estate Sales Australia. Browse the latest listings for sale and rent across Australia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
