"use server";

import {
  extractCoordinatesFromUrl,
  extractPlaceQueryFromUrl,
  isShortMapsLink,
} from "@/lib/maps/parse-maps-url";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";

export type ResolveMapsUrlResult =
  | { ok: true; lat: number; lng: number; source: "url" | "geocoding" }
  | { ok: false; error: string };

// Server Action porque acá pasan dos cosas que no pueden correr en el
// navegador: (1) seguir el redirect de un enlace corto — CORS lo bloquea
// desde el cliente, y (2) el fallback de Geocoding API necesita la API key
// server-side, nunca expuesta con NEXT_PUBLIC_. Gateada detrás de sesión de
// agente igual que el resto de las mutaciones admin — no tiene sentido
// exponerla a cualquiera sin loguearse.
export async function resolveMapsUrl(rawUrl: string): Promise<ResolveMapsUrlResult> {
  const agent = await getCurrentAgent();
  if (!agent) return { ok: false, error: "No autorizado." };

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Pegá una URL válida (tiene que empezar con https://)." };
  }

  if (!/(^|\.)google\.[a-z.]+$|(^|\.)goo\.gl$/.test(url.hostname)) {
    return {
      ok: false,
      error: "Esa URL no parece ser de Google Maps. Copiala desde el botón \"Compartir\" del pin.",
    };
  }

  let finalUrl = url.toString();
  if (isShortMapsLink(finalUrl)) {
    try {
      const res = await fetch(finalUrl, { redirect: "follow" });
      finalUrl = res.url || finalUrl;
    } catch {
      return {
        ok: false,
        error: "No pudimos abrir ese enlace corto. Probá pegando la URL completa desde el navegador.",
      };
    }
  }

  const coords = extractCoordinatesFromUrl(finalUrl);
  if (coords) {
    return { ok: true, lat: coords.lat, lng: coords.lng, source: "url" };
  }

  // Fallback opcional — solo corre si el cliente configuró la clave. Sin
  // ella, esta URL específica no se pudo resolver y el formulario ofrece el
  // selector manual (ver location-picker.tsx).
  const geocodingKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  const placeQuery = extractPlaceQueryFromUrl(finalUrl);

  if (geocodingKey && placeQuery) {
    try {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          placeQuery,
        )}&key=${geocodingKey}`,
      );
      const geoData = (await geoRes.json()) as {
        status: string;
        results?: { geometry?: { location?: { lat: number; lng: number } } }[];
      };
      const location = geoData.results?.[0]?.geometry?.location;
      if (
        geoData.status === "OK" &&
        location &&
        typeof location.lat === "number" &&
        typeof location.lng === "number"
      ) {
        return { ok: true, lat: location.lat, lng: location.lng, source: "geocoding" };
      }
    } catch {
      // Cae al error genérico de abajo — no interrumpe el flujo con un 500.
    }
  }

  return {
    ok: false,
    error:
      "No pudimos extraer coordenadas de esa URL. Ingresá la latitud y longitud manualmente más abajo.",
  };
}
