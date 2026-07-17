import type { MetadataRoute } from "next";
import { business, services, suburbs, suburbSlug } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = business.baseUrl;
  const staticPages = ["", "/services", "/areas", "/about", "/contact"].map(
    (p) => ({
      url: `${base}${p}`,
      changeFrequency: "monthly" as const,
      priority: p === "" ? 1 : 0.8,
    })
  );
  const servicePages = services.map((s) => ({
    url: `${base}/services/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const areaPages = suburbs.map((s) => ({
    url: `${base}/areas/${suburbSlug(s)}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticPages, ...servicePages, ...areaPages];
}
