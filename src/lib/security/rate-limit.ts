import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Sin Upstash configurado, cae a un limitador en memoria (server-only, no
// sobrevive reinicios ni escala a más de una instancia) — sirve para no
// bloquear el flujo en dev, pero en producción real hace falta
// UPSTASH_REDIS_REST_URL/TOKEN en .env.local.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Auditoría 2026-08-15 (A5): el fallback en memoria es intencional para no
// bloquear el flujo en dev, pero en un entorno serverless real (Vercel) cada
// instancia fría tiene su propio Map — el límite deja de ser efectivo entre
// invocaciones. No se cambia el comportamiento (seguiría funcionando, solo
// que sin límite real) para no romper login/reset si alguien despliega sin
// Upstash todavía — pero queda un aviso fuerte en los logs del servidor.
if (!hasUpstash && process.env.NODE_ENV === "production") {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN no configuradas en producción — " +
      "el rate limiting de login, reset de contraseña y leads corre en memoria " +
      "por instancia y NO protege de forma efectiva contra fuerza bruta/spam " +
      "distribuido. Provisioná Upstash antes de recibir tráfico real.",
  );
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  limit = 5,
  windowMs = 60_000,
): Promise<{ success: boolean }> {
  if (hasUpstash) {
    const ratelimit = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    });
    const { success } = await ratelimit.limit(identifier);
    return { success };
  }

  const now = Date.now();
  const entry = memoryStore.get(identifier);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  if (entry.count >= limit) return { success: false };
  entry.count += 1;
  return { success: true };
}
