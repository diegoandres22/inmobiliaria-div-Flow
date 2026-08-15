"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hashIp } from "@/lib/security/hash-ip";

// Antes el login llamaba a supabase.auth.signInWithPassword() directo desde
// el cliente (login-form.tsx) — no había ningún punto server-side donde
// interceptar el intento antes de que llegara a Supabase, así que no se
// podía aplicar rate limiting propio (más agresivo y con mensaje propio que
// el límite genérico de GoTrue). Server Action = el intento pasa por acá
// primero, y de paso Next protege esta ruta con su chequeo de origen nativo
// para Server Actions (mismo mecanismo que ya cubre todas las mutaciones
// del panel admin).
const LOGIN_RATE_LIMIT = 8;
const LOGIN_RATE_WINDOW_MS = 15 * 60_000;

export async function signInWithPassword(
  formData: FormData,
): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  const { success: withinRateLimit } = await checkRateLimit(
    `admin-login:${ipHash}`,
    LOGIN_RATE_LIMIT,
    LOGIN_RATE_WINDOW_MS,
  );

  if (!withinRateLimit) {
    return {
      error: "Demasiados intentos de inicio de sesión. Probá de nuevo en 15 minutos.",
    };
  }

  if (!email || !password) {
    return { error: "Email o contraseña incorrectos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensaje siempre genérico — nunca distinguir "no existe la cuenta" de
    // "contraseña incorrecta": eso permite enumerar emails registrados.
    return { error: "Email o contraseña incorrectos." };
  }

  redirect("/admin/propiedades");
}
