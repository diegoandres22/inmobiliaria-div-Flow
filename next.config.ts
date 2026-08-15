import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, // no exponer "X-Powered-By: Next.js"
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        // Placeholder — se ajusta al host real del proyecto Supabase en FASE 4
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        // Fotos de stock para los datos mock de FASE 2 — se retira cuando
        // haya propiedades reales con imágenes en Supabase Storage (FASE 4)
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
