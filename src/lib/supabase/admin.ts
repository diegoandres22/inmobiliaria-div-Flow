import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Bypasa RLS por completo con la service_role key — SOLO para Server
// Actions/route handlers que ya validaron el input (zod + rate limit +
// honeypot en leads, sesión de agente verificada en mutaciones admin).
// "server-only" rompe el build si esto se importa por error en un client component.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
