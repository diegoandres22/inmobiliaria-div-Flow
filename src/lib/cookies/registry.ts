// Fuente única de verdad de qué cookies existen realmente en el sitio —
// tanto el banner como /legal/cookies leen de acá, para que la política
// nunca describa cookies que no existen (o se olvide de una que sí).
//
// df_fav_session se clasifica como "Esenciales" a propósito: es 100%
// first-party, no rastrea entre sitios, y solo se crea cuando el visitante
// hace una acción explícita (marcar un favorito) — mismo criterio que usa
// la excepción de "servicio expresamente solicitado por el usuario" del
// art. 5(3) de la directiva ePrivacy europea, aplicado acá como buena
// práctica aunque Venezuela no tenga una norma equivalente vigente. Antes
// de operar con un cliente real, confirmar esta clasificación con un
// abogado en la jurisdicción real de operación.
export interface CookieRegistryEntry {
  name: string;
  category: "Esenciales" | "Funcionales" | "Analíticas" | "Marketing";
  purpose: string;
  duration: string;
}

export const COOKIE_REGISTRY: CookieRegistryEntry[] = [
  {
    name: "sb-access-token / sb-refresh-token",
    category: "Esenciales",
    purpose: "Mantener iniciada la sesión del panel de administración (Supabase Auth).",
    duration: "Sesión / hasta cerrar sesión",
  },
  {
    name: "df_admin_last_seen",
    category: "Esenciales",
    purpose: "Cerrar automáticamente la sesión del panel tras 30 minutos de inactividad.",
    duration: "30 minutos",
  },
  {
    name: "df_cookie_consent",
    category: "Esenciales",
    purpose: "Recordar tus preferencias de cookies para no volver a preguntarte en cada visita.",
    duration: "1 año",
  },
  {
    name: "df_fav_session",
    category: "Esenciales",
    purpose: "Recordar las propiedades que marcaste como favoritas, sin necesidad de crear una cuenta.",
    duration: "1 año",
  },
  {
    name: "_ga, _gid (Google Analytics)",
    category: "Analíticas",
    purpose: "Medir de forma agregada cómo se usa el sitio. Solo se cargan si aceptás la categoría Analíticas.",
    duration: "Hasta 2 años — solo si están activas",
  },
];
