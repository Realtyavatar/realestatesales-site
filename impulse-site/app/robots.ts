import type { MetadataRoute } from "next";
import { business } from "@/lib/data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${business.baseUrl}/sitemap.xml`,
  };
}
