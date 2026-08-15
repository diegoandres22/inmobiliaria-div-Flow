import type { MetadataRoute } from "next";
import { clientConfig } from "@/config/client.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${clientConfig.seo.siteUrl}/sitemap.xml`,
  };
}
