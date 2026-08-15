import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { clientConfig } from "@/config/client.config";

// Solo status='publicada' — mismo filtro que el resto del sitio público, no
// hay razón para indexar (ni siquiera vía sitemap) un borrador o algo
// archivado.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("slug, updated_at")
    .eq("status", "publicada");

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/propiedades",
    "/agencias",
    "/contacto",
  ].map((path) => ({
    url: `${clientConfig.seo.siteUrl}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  const propertyRoutes: MetadataRoute.Sitemap = (properties ?? []).map(
    (p) => ({
      url: `${clientConfig.seo.siteUrl}/propiedades/${p.slug}`,
      lastModified: p.updated_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.9,
    }),
  );

  return [...staticRoutes, ...propertyRoutes];
}
