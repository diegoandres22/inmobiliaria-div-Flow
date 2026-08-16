import type { NextConfig } from "next";
// Corre la validación de env vars apenas Next evalúa este archivo — es decir,
// antes de arrancar `next dev`/`next build`. Si falta algo requerido, el
// proceso corta acá con un mensaje claro (ver src/env.ts) en vez de fallar
// más tarde en producción con un 500 opaco.
import "./src/env";

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
