import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// Cliente de navegador — respeta RLS, usa la clave pública (anon/publishable).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
