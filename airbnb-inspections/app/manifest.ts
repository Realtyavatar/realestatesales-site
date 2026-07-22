import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Checkout Inspections",
    short_name: "Inspections",
    description:
      "Airbnb checkout inspection checklists with timestamped photos, damage flags and PDF reports.",
    start_url: "/inspections",
    display: "standalone",
    background_color: "#11363b",
    theme_color: "#11363b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
