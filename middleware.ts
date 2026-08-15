import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname === "/admin/login";
  // El callback de OAuth (Google) llega SIN sesión todavía — recién la crea
  // el propio route handler al intercambiar el "code". Si no se exceptúa
  // acá, el middleware redirige a /admin/login antes de que el handler
  // llegue a correr y el login con Google nunca termina de cerrar el círculo.
  const isAuthCallbackRoute = request.nextUrl.pathname === "/admin/auth/callback";

  if (isAdminRoute && !isLoginRoute && !isAuthCallbackRoute && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
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
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://images.unsplash.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://api.maptiler.com",
      "font-src 'self' data:",
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
