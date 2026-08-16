import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LAST_SEEN_COOKIE = "df_admin_last_seen";
// Auditoría AppSec: "expiración de sesión por inactividad" — 30 min sin
// pegarle a ninguna ruta /admin cierra la sesión server-side (no solo un
// timer en el cliente que se puede evadir). El cookie de refresh de
// Supabase dura mucho más que esto a propósito: son dos controles
// distintos (duración máxima de sesión vs. inactividad).
const INACTIVITY_LIMIT_MS = 30 * 60_000;

// Dos trabajos: (1) refrescar la sesión de Supabase en cada request y
// proteger /admin/*, (2) headers de seguridad en toda respuesta.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";
  // El callback de OAuth (Google) llega SIN sesión todavía — recién la crea
  // el propio route handler al intercambiar el "code". Si no se exceptúa
  // acá, el middleware redirige a /admin/login antes de que el handler
  // llegue a correr y el login con Google nunca termina de cerrar el círculo.
  const isAuthCallbackRoute = pathname === "/admin/auth/callback";
  // La propia pantalla de challenge de 2FA necesita sesión (aal1) pero
  // TODAVÍA no aal2 — si se la protege con la misma regla de abajo, nadie
  // podría nunca llegar a ingresar su código.
  const isMfaChallengeRoute = pathname === "/admin/mfa-challenge";
  // "Olvidé mi contraseña" es público, como /admin/login — todavía no hay
  // sesión en este punto del flujo.
  const isForgotPasswordRoute = pathname === "/admin/olvide-password";
  // "Elegir contraseña nueva" SÍ necesita sesión (la deja el intercambio de
  // código en /admin/auth/callback), pero se exceptúa del gate de 2FA de
  // abajo por la misma razón que /admin/mfa-challenge: si la cuenta tiene
  // 2FA activado, esta pantalla igual deja fijar la contraseña, pero el
  // PRÓXIMO request a cualquier otra ruta de /admin va a pedir el código
  // igual — resetear la contraseña nunca alcanza sola para entrar al panel
  // si hay un segundo factor de por medio, ninguno de los dos sustituye al otro.
  const isResetPasswordRoute = pathname === "/admin/reset-password";

  const requiresSession =
    isAdminRoute &&
    !isLoginRoute &&
    !isAuthCallbackRoute &&
    !isForgotPasswordRoute;

  if (requiresSession && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (requiresSession && user) {
    // Inactividad: si ya había una marca de actividad y pasó el límite,
    // cerrar sesión de verdad (revoca el refresh token en Supabase, no solo
    // borra cookies) y mandar a login con el motivo.
    const lastSeenRaw = request.cookies.get(LAST_SEEN_COOKIE)?.value;
    const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : null;
    const now = Date.now();

    if (lastSeen && now - lastSeen > INACTIVITY_LIMIT_MS) {
      await supabase.auth.signOut();
      const timeoutResponse = NextResponse.redirect(
        new URL("/admin/login?error=inactivity", request.url),
      );
      // signOut() ya reescribió `response` con las cookies de auth borradas
      // (vía el setAll del cliente de arriba) — se trasladan a la respuesta
      // de redirect para que el navegador también las limpie, no alcanza
      // con revocar el refresh token solo del lado del servidor.
      for (const cookie of response.cookies.getAll()) {
        timeoutResponse.cookies.set(cookie);
      }
      timeoutResponse.cookies.delete(LAST_SEEN_COOKIE);
      return timeoutResponse;
    }

    response.cookies.set(LAST_SEEN_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.ceil(INACTIVITY_LIMIT_MS / 1000) + 60,
    });

    // 2FA (TOTP) opcional por agente: si el agente activó un factor
    // verificado, Supabase debería exigir "aal2" para considerarlo
    // autenticado del todo.
    //
    // OJO: no se usa `nextLevel` de getAuthenticatorAssuranceLevel() para
    // decidir esto — es un bug conocido y viejo del SDK de Supabase
    // (supabase/auth-js#589, discussión supabase/supabase#11383, todavía
    // reportado en 2025 con versiones recientes) donde `nextLevel` se queda
    // en "aal1" en sesiones nuevas aunque el usuario SÍ tenga un factor
    // verificado — con ese campo, el challenge nunca se disparaba después
    // de un login limpio. `currentLevel` (lo que la sesión actual probó
    // realmente, viene firmado en el JWT) sí es confiable. Acá se compara
    // contra "¿tiene algún factor verificado?" preguntado directo con
    // listFactors() en vez de confiar en el cálculo interno del SDK.
    if (!isMfaChallengeRoute && !isResetPasswordRoute) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.currentLevel !== "aal2") {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const hasVerifiedFactor = (factorsData?.totp ?? []).some(
          (f) => f.status === "verified",
        );
        if (hasVerifiedFactor) {
          return NextResponse.redirect(new URL("/admin/mfa-challenge", request.url));
        }
      }
    }
  }

  // Fuerza HTTPS en producción — Vercel ya termina TLS y castiga en HSTS,
  // esto es la red de seguridad si algo llega por HTTP igual (proxy mal
  // configurado, etc.).
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  // TODO: script-src con nonce por request en vez de 'unsafe-inline' —
  // simplificación consciente por ahora, requiere wiring extra en layout.tsx
  //
  // googletagmanager.com / google-analytics.com pre-habilitados a propósito:
  // el consentimiento de cookies (CookieConsent) es el que decide si GA4
  // llega a insertarse en el DOM o no — si nunca hay consentimiento de
  // "analíticas", el script simplemente no se renderiza y estos orígenes
  // quedan permitidos pero sin uso. El bloqueo real vive en React, no acá.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://images.unsplash.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com",
      "font-src 'self' data:",
      // Mapa embebido (PropertyMap / LocationPicker) — Google Maps Embed API
      // se sirve desde este origen dentro de un iframe.
      "frame-src https://www.google.com",
      "frame-ancestors 'none'",
    ].join("; "),
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
