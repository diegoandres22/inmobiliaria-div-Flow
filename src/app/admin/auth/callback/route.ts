import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Adonde vuelve Google después del consentimiento. Regla dura acordada con
// Diego: Google es un método de login alternativo, NO una puerta de alta —
// si el email autenticado no tiene fila en `agents`, se cierra la sesión
// acá mismo y no llega a ver nada del panel. No confiamos solo en el toggle
// "Allow new user signups" del dashboard de Supabase — este chequeo es
// explícito y corre siempre, sea cual sea esa config.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=oauth`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/admin/login?error=oauth`);
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

  return NextResponse.redirect(`${origin}/admin/propiedades`);
}
