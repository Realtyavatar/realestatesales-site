import type { MetadataRoute } from "next";
import { areaPath, business, services, suburbs } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = business.baseUrl;
  const staticPages = [
    "",
    "/services",
    "/areas",
    "/about",
    "/contact",
    "/how-to-choose-the-right-electrician-on-the-mornington-peninsula",
  ].map(
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
  const areaPages = [
    ...suburbs.map((s) => `${base}${areaPath(s)}`),
    `${base}/electrician-mornington-peninsula`,
  ].map((url) => ({
    url,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticPages, ...servicePages, ...areaPages];
}
