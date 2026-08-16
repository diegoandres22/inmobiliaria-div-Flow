// Sin dependencias externas a propósito — es puro string/regex, corre igual
// server-side (Server Action) o client-side (validación instantánea antes
// de tocar la red) sin arrastrar el SDK de Google Maps solo para esto.
//
// Patrones más comunes en URLs de Google Maps (o en la URL final tras
// seguir el redirect de un enlace corto maps.app.goo.gl / goo.gl/maps):
//   - .../@-34.603722,-58.381592,17z...        → vista centrada en el pin
//   - ...?q=-34.603722,-58.381592               → parámetro de búsqueda
//   - ...?ll=-34.603722,-58.381592              → variante antigua
//   - ...!3d-34.603722!4d-58.381592...          → coordenadas exactas del
//     lugar, embebidas en el bloque `data=` — es el formato más común al
//     compartir un lugar puntual ("place") desde la app de Maps.
const COORDINATE_PATTERNS: RegExp[] = [
  /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
];

export interface Coordinates {
  lat: number;
  lng: number;
}

export function extractCoordinatesFromUrl(url: string): Coordinates | null {
  for (const pattern of COORDINATE_PATTERNS) {
    const match = url.match(pattern);
    if (!match) continue;

    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      return { lat, lng };
    }
  }
  return null;
}

// Fallback para el Geocoding API cuando la URL no trae coordenadas
// embebidas (pasa con algunos links de "place" sin el bloque !3d!4d) —
// intenta sacar el nombre del lugar del segmento /maps/place/{nombre}/.
export function extractPlaceQueryFromUrl(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/@]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).replace(/\+/g, " ");
  } catch {
    return null;
  }
}

const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

export function isShortMapsLink(url: string): boolean {
  try {
    return SHORT_LINK_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}
