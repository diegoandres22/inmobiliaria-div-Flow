/**
 * ============================================================================
 * CONFIGURACIÓN DE CLIENTE — divflow-realty (base white-label)
 * ============================================================================
 *
 * Este es el ÚNICO archivo que se edita para adaptar esta base a un cliente
 * inmobiliario nuevo. No hace falta tocar componentes, estilos ni la
 * arquitectura — todo lo que varía entre clientes vive acá adentro.
 *
 * Cómo reutilizar esta base para un cliente nuevo:
 *   1. Cloná el repo / usalo como template.
 *   2. Editá los valores de `clientConfig` más abajo (marca, colores, contacto,
 *      copys, legales) — es el único archivo que hace falta tocar. Los
 *      colores se sincronizan solos hacia Tailwind (src/app/globals.css) al
 *      correr `pnpm dev`/`pnpm build`, ver scripts/sync-theme.mjs.
 *   3. Los secretos (API keys, tokens) NUNCA van acá — van en variables de
 *      entorno (.env.local). Este archivo solo referencia el NOMBRE de la
 *      variable esperada, no el valor.
 *   4. Provisioná un proyecto Supabase propio para el cliente (ver
 *      docs/DOCUMENTACION-IMPLEMENTACION.md) y corré las migraciones — este
 *      archivo no reemplaza esa capa, solo la identidad/contenido de marca.
 *
 * Campos en null o con TODO(cliente) son los que el cliente nuevo tiene que
 * completar sí o sí antes de salir a producción.
 */

export interface ClientConfig {
  brand: {
    /** Nombre público de marca — usado en título del sitio, footer, metadata. */
    name: string;
    /** Razón social — usado en textos legales. */
    legalName: string;
    /** Frase corta bajo el nombre — hero, meta description por defecto. */
    tagline: string;
    logo: {
      /** SVG del logo completo (ícono + wordmark). */
      primary: string;
      /** Solo el ícono, para favicon/avatar. */
      icon: string;
    };
    favicon: string;
    /**
     * Fuente de verdad real de la paleta — scripts/sync-theme.mjs lee estos
     * valores y reescribe los tokens --color-brand-* de src/app/globals.css
     * automáticamente antes de cada `pnpm dev`/`pnpm build` (hooks predev/
     * prebuild en package.json). Cambiar el color acá alcanza; no hace falta
     * tocar globals.css a mano. Ver docs/DOCUMENTACION-PROYECTO.md sección 7.
     */
    colors: {
      accent: string;
      accentDark: string;
      ink: string;
      paper: string;
      neutral: string;
    };
    /** Deben coincidir con las fuentes cargadas en src/app/layout.tsx. */
    fonts: {
      heading: string;
      body: string;
    };
  };

  contact: {
    /** Teléfono de contacto general, formato legible. */
    phone: string;
    /**
     * WhatsApp en formato E.164 sin "+", ej. "521234567890".
     * null = el botón flotante de WhatsApp (WhatsAppCTA) no se renderiza —
     * nunca se muestra un botón que lleve a ningún lado.
     */
    whatsapp: string | null;
    email: string;
    address: string;
    /**
     * URLs reales de redes sociales. null = ese ícono no se muestra en el
     * footer — corrige a propósito la debilidad de la referencia (enlaces
     * href="#" muertos). Nunca poner "#" acá.
     */
    social: {
      instagram: string | null;
      facebook: string | null;
      tiktok: string | null;
    };
  };

  copy: {
    heroTitle: string;
    heroSubtitle: string;
    aboutTitle: string;
    aboutBody: string;
    /** Ciudades/zonas donde opera — se muestra en el footer. */
    coverageZones: string[];
    /** Texto arriba del formulario de contacto en la ficha de propiedad. */
    leadFormPrompt: string;
  };

  legal: {
    companyName: string;
    /**
     * Identificación fiscal (RIF en Venezuela, RFC/CUIT/NIT en otros países
     * de la base). Se muestra en Términos y Política de Privacidad.
     */
    taxId: string;
    /** Domicilio legal/fiscal completo. */
    registeredAddress: string;
    /** null = no se muestra el link en el footer. */
    privacyPolicyUrl: string | null;
    termsUrl: string | null;
    /** Texto corto junto al © en el footer. */
    footerDisclaimer: string;
  };

  propertyData: {
    /**
     * "manual" = las propiedades se cargan por el panel admin (/admin).
     * "api" = se sincronizan desde un feed externo (no implementado en esta
     * base — si el cliente lo necesita, es un módulo nuevo, no un toggle).
     */
    source: "manual" | "api";
    apiBaseUrl: string | null;
  };

  integrations: {
    /**
     * Nombres de las variables de entorno esperadas — los VALORES reales
     * van en .env.local, nunca en este archivo. Ver .env.example.
     */
    googleMapsEmbedKeyEnvVar: "NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY";
    analyticsIdEnvVar: "NEXT_PUBLIC_ANALYTICS_ID";
    whatsappBusinessEnvVar: "NEXT_PUBLIC_WHATSAPP_BUSINESS_ID";
  };

  seo: {
    /** Dominio real de producción, sin barra final. Usado en metadataBase y JSON-LD. */
    siteUrl: string;
    defaultLocale: string;
  };
}

export const clientConfig: ClientConfig = {
  brand: {
    name: "Inmobiliaria DivFlow",
    legalName: "Inmobiliaria DivFlow", // TODO(cliente): razón social si es distinta al nombre de marca
    tagline: "Encuentra tu próxima propiedad — venta y alquiler.",
    logo: {
      primary: "/logo-positivo.svg", // TODO(cliente): no existe el archivo todavía, ver src/components/layout/logo.tsx
      icon: "/icon.svg",
    },
    favicon: "/favicon.ico",
    colors: {
      accent: "#5DCAA5",
      accentDark: "#0F6E56",
      ink: "#2C2C2A",
      paper: "#FFFFFF",
      neutral: "#F1EFE8",
    },
    fonts: {
      heading: "Space Grotesk",
      body: "Inter",
    },
  },

  contact: {
    phone: "+00 000 000 0000", // TODO(cliente)
    // Deshabilitado a propósito por ahora — con null, WhatsAppCTA y el link
    // del footer no se renderizan (ver footer.tsx/whatsapp-cta.tsx), pero el
    // componente queda intacto: alcanza con poner el número acá para
    // reactivarlo, sin tocar código.
    whatsapp: null, // TODO(cliente): "521234567890" — sin "+"
    email: "diegoandresv22@gmail.com",
    address: "Dirección pendiente de definir", // TODO(cliente)
    social: {
      instagram: null, // TODO(cliente)
      facebook: null, // TODO(cliente)
      tiktok: null, // TODO(cliente)
    },
  },

  copy: {
    heroTitle: "Encontrá el lugar donde vas a vivir tu próxima etapa",
    heroSubtitle:
      "Miles de propiedades en venta y alquiler en toda la región — filtros reales, sin recargar la página.",
    aboutTitle: "Sobre nosotros",
    aboutBody:
      "Somos una red de agentes inmobiliarios conectados en una sola plataforma, para que encontrar o publicar una propiedad sea simple y transparente.",
    coverageZones: [], // TODO(cliente): ["Ciudad de México", "Guadalajara", ...]
    leadFormPrompt: "¿Preguntas? Escribile al agente",
  },

  legal: {
    // Modo demo (Venezuela) — dato de simulación, no la razón social real.
    // TODO(cliente real): razón social exacta tal como está inscrita.
    companyName: "Inversiones Inmobiliarias DivFlow, C.A.",
    // TODO(cliente real): RIF real de la empresa — esto es un dato de
    // simulación, no corresponde a un RIF válido.
    taxId: "J-40123456-7",
    // TODO(cliente real): domicilio fiscal real.
    registeredAddress:
      "Av. Francisco de Miranda, Torre Diamen, Piso 6, Chacao, Caracas 1060, Venezuela",
    privacyPolicyUrl: null, // TODO(cliente)
    termsUrl: null, // TODO(cliente)
    footerDisclaimer: "Todos los derechos reservados.",
  },

  propertyData: {
    source: "manual",
    apiBaseUrl: null,
  },

  integrations: {
    googleMapsEmbedKeyEnvVar: "NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY",
    analyticsIdEnvVar: "NEXT_PUBLIC_ANALYTICS_ID",
    whatsappBusinessEnvVar: "NEXT_PUBLIC_WHATSAPP_BUSINESS_ID",
  },

  seo: {
    // Sin dominio propio todavía — URL real de Vercel. Cuando compres un
    // dominio, actualizar acá y agregarlo también como Redirect URL en
    // Supabase Auth (Google OAuth + reset de contraseña dependen de eso).
    siteUrl: "https://inmobiliaria-divflow.vercel.app",
    defaultLocale: "es",
  },
};
