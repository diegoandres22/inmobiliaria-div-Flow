import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getFavoritesSessionId } from "@/lib/session/favorites-session";

// Set de property_id favoriteados por la sesión anónima actual — vacío si
// todavía no existe cookie de sesión (nadie marcó nada). cache() evita
// repetir la query si varias PropertyCard piden esto en el mismo request.
export const getFavoriteIds = cache(async (): Promise<Set<string>> => {
  const sessionId = await getFavoritesSessionId();
  if (!sessionId) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("session_id", sessionId);

  return new Set((data ?? []).map((row) => row.property_id as string));
});
