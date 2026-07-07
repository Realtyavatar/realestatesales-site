import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Impulse Reports",
    short_name: "Impulse",
    description:
      "Job reports, defects and variation sign-off for Impulse Electrical Contractors.",
    start_url: "/jobs",
    display: "standalone",
    background_color: "#0b2545",
    theme_color: "#0b2545",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
