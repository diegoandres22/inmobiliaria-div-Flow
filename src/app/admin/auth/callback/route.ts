import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Adonde vuelve Google después del consentimiento. Regla dura acordada con
// Diego: Google es un método de login alternativo, NO una puerta de alta —
// si el email autenticado no tiene fila en `agents`, se cierra la sesión
// acá mismo y no llega a ver nada del panel. No confiamos solo en el toggle
// "Allow new user signups" del dashboard de Supabase — este chequeo es
// explícito y corre siempre, sea cual sea esa config.
//
// Mismo endpoint también resuelve el código PKCE del email de "olvidé mi
// contraseña" (ver olvide-password/actions.ts) — exchangeCodeForSession() es
// el mismo mecanismo para los dos casos, no hacía falta duplicar esta lógica
// en una ruta aparte. `next` es lo único que los distingue: si viene, y es
// EXACTAMENTE la ruta que nosotros mismos generamos (whitelist estricta, no
// se acepta cualquier valor — si no, esto sería un open redirect), manda ahí
// en vez de al panel. El chequeo de "¿existe en agents?" sigue aplicando
// igual para el flujo de reset: no tiene sentido dejar poner una contraseña
// nueva a una cuenta de auth que no es la de ningún agente real.
const ALLOWED_NEXT_PATHS = new Set(["/admin/reset-password"]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next = rawNext && ALLOWED_NEXT_PATHS.has(rawNext) ? rawNext : null;
  const failureUrl = next
    ? `${origin}/admin/olvide-password?error=expired`
    : `${origin}/admin/login?error=oauth`;

  if (!code) {
    return NextResponse.redirect(failureUrl);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(failureUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: agent } = user
    ? await supabase
        .from("agents")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle()
    : { data: null };

  if (!agent) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=not_authorized`);
  }

  return NextResponse.redirect(`${origin}${next ?? "/admin/propiedades"}`);
}
