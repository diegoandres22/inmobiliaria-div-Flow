import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Sin Upstash configurado, cae a un limitador en memoria (server-only, no
// sobrevive reinicios ni escala a más de una instancia) — sirve para no
// bloquear el flujo en dev, pero en producción real hace falta
// UPSTASH_REDIS_REST_URL/TOKEN en .env.local.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

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
