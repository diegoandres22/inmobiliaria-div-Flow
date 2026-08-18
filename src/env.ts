import { z } from "zod";

/**
 * ============================================================================
 * VALIDACIÓN DE VARIABLES DE ENTORNO
 * ============================================================================
 *
 * Por qué existe: el primer deploy a Vercel de este proyecto falló con
 * `MIDDLEWARE_INVOCATION_FAILED` (500 en todas las rutas) porque faltaban
 * NEXT_PUBLIC_SUPABASE_URL/ANON_KEY — el único síntoma visible fue un error
 * genérico de Next, y hubo que leer los logs de runtime de Vercel para
 * encontrar la causa real ("Your project's URL and Key are required to
 * create a Supabase client!"). Este módulo mueve ese chequeo a ANTES del
 * build: si falta algo requerido, `next build` (o `next dev`) corta acá
 * mismo con un mensaje legible, en vez de fallar en producción con un 500
 * opaco en el primer request.
 *
 * Se importa desde next.config.ts, que Next.js evalúa antes de arrancar el
 * build/dev server (con las env vars ya cargadas desde .env.local /
 * Vercel), así que es el único punto que garantiza correr siempre.
 *
 * Nota de alcance: los call-sites existentes (src/lib/supabase/*.ts,
 * middleware.ts, etc.) siguen leyendo `process.env.X!` directo — no se
 * tocaron para mantener este cambio acotado y no arriesgar una regresión en
 * código ya probado. Este módulo es la red de seguridad de "fallar temprano
 * con un mensaje claro", no un reemplazo de esos usos. Para código nuevo,
 * preferir importar `env` de acá en vez de `process.env` directo — da
 * autocompletado y la garantía de que si el build pasó, la variable existe.
 */

const envSchema = z.object({
  // Requeridas — sin esto nada funciona, ni siquiera renderizar el layout
  // raíz (createClient() truena). Ver docs/DOCUMENTACION-IMPLEMENTACION.md
  // sección 3.4 para de dónde sale cada una.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Opcionales — el sitio degrada con gracia sin ellas (ver
  // DOCUMENTACION-PROYECTO.md secciones 6.7/6.8), pero si están presentes
  // deben tener una forma válida: un typo silencioso (ej. una URL de
  // Upstash mal pegada) es peor que no configurarla, porque parece andar
  // pero no protege nada.
  DATABASE_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  IP_HASH_SALT: z.string().min(16).optional(),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().min(1).optional(),
});

// De dónde sacar cada variable — se agrega al mensaje de error para que
// quien despliegue esto por primera vez no tenga que ir a buscar la guía.
const WHERE_TO_GET_IT: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "Supabase → Project Settings → API → Project URL",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase → Project Settings → API → anon public key",
  SUPABASE_SERVICE_ROLE_KEY:
    "Supabase → Project Settings → API → service_role key (NUNCA con prefijo NEXT_PUBLIC_)",
  IP_HASH_SALT: "cualquier string largo y secreto, ej. `openssl rand -hex 32` (mínimo 16 caracteres)",
  UPSTASH_REDIS_REST_URL: "Upstash → base Redis → REST API",
  UPSTASH_REDIS_REST_TOKEN: "Upstash → base Redis → REST API",
};

// Vercel (y otros) exponen una variable declarada en el dashboard pero sin
// valor cargado como string vacío ("") en process.env, no como ausente. Zod
// `.optional()` solo perdona `undefined` — sin este paso, una var opcional
// "declarada pero vacía" fallaba igual que si tuviera un valor inválido
// (bug real: así reventó el primer deploy de este cambio en Vercel).
// Tratamos "" como "no seteada" para TODAS las keys antes de validar.
function emptyStringsToUndefined(input: NodeJS.ProcessEnv) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value === "" ? undefined : value]),
  );
}

function loadEnv() {
  const result = envSchema.safeParse(emptyStringsToUndefined(process.env));

  if (!result.success) {
    const lines = result.error.issues.map((issue) => {
      const key = String(issue.path[0] ?? "");
      const hint = WHERE_TO_GET_IT[key];
      return `  - ${key}: ${issue.message}${hint ? ` — ${hint}` : ""}`;
    });

    const message = [
      "",
      "Variables de entorno inválidas o faltantes:",
      "",
      ...lines,
      "",
      "Ver docs/DOCUMENTACION-IMPLEMENTACION.md sección 3.4 para el detalle completo.",
      "",
    ].join("\n");

    console.error(message);
    throw new Error("Configuración de entorno inválida — ver detalle arriba.");
  }

  return result.data;
}

export const env = loadEnv();

// Avisos no bloqueantes — falta algo recomendado pero no requerido para
// arrancar. Mismo criterio que ya usa src/lib/security/rate-limit.ts.
if (process.env.NODE_ENV === "production") {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
      "[env] Upstash no configurado en producción — el rate limiting corre en memoria por instancia, no distribuido (ver DOCUMENTACION-PROYECTO.md sección 6.8).",
    );
  }
  if (!env.IP_HASH_SALT) {
    console.warn(
      "[env] IP_HASH_SALT no configurada en producción — leads.ip_hash usa el fallback de desarrollo, no anonimiza IPs de verdad.",
    );
  }
  if (!env.RESEND_API_KEY) {
    console.warn(
      "[env] RESEND_API_KEY no configurada — los emails transaccionales (aviso de cambio de contraseña) no se envían.",
    );
  }
}
