import "server-only";
import { cookies } from "next/headers";
import { customAlphabet } from "nanoid";

const COOKIE_NAME = "df_fav_session";
const ONE_YEAR = 60 * 60 * 24 * 365;
const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  32,
);

// Sesión anónima de favoritos — sin login, ver favorites (session_id,
// property_id) en Supabase. httpOnly: el cliente nunca necesita leer el
// valor, solo que el navegador lo reenvíe. Nunca se genera durante el
// render de un Server Component (Next no lo permite); solo se crea de
// forma perezosa la primera vez que alguien marca un favorito, desde un
// Route Handler.
export async function getFavoritesSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

// Solo llamar desde Route Handlers / Server Actions (los únicos contextos
// donde Next permite escribir cookies).
export async function getOrCreateFavoritesSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const sessionId = nanoid();
  store.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return sessionId;
}
