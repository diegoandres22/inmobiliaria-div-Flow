"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hashIp } from "@/lib/security/hash-ip";
import { clientConfig } from "@/config/client.config";

const RESET_RATE_LIMIT = 5;
const RESET_RATE_WINDOW_MS = 15 * 60_000;

// Supabase mismo no revela si el email existe o no (resetPasswordForEmail
// no manda el mail si no hay cuenta, pero tampoco devuelve error) — este
// action sigue el mismo criterio: SIEMPRE responde igual, exista o no la
// cuenta, se haya podido mandar el email o no. Nunca hay que dejar que
// alguien confirme por acá qué emails están dados de alta como agentes.
export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  const { success: withinRateLimit } = await checkRateLimit(
    `password-reset:${ipHash}`,
    RESET_RATE_LIMIT,
    RESET_RATE_WINDOW_MS,
  );
  if (!withinRateLimit) return;

  const supabase = await createClient();
  const origin = headersList.get("origin") ?? clientConfig.seo.siteUrl;

  // El código PKCE que arma resetPasswordForEmail se resuelve en el MISMO
  // callback que ya usa el login con Google (exchangeCodeForSession) — el
  // parámetro `next` es lo único que lo distingue: le dice al callback que,
  // tras validar el código, mande al agente a elegir contraseña nueva en vez
  // de directo al panel (ver src/app/admin/auth/callback/route.ts).
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/admin/auth/callback?next=/admin/reset-password`,
  });
}
