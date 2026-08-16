import "server-only";

// Los Server Actions ("use server") ya tienen protección CSRF nativa de
// Next.js (compara Origin vs Host en cada POST). Los Route Handlers propios
// (api/leads, api/favorites) NO la tienen automática — esto es la misma
// idea a mano: si el request trae Origin y no coincide con el Host, es un
// POST disparado desde otro sitio, se rechaza. Si no trae Origin (algunos
// proxies/clientes viejos lo sacan) no se penaliza acá — el rate limiting y
// el honeypot ya cubren el caso de abuso sin depender de este header.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host = request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
