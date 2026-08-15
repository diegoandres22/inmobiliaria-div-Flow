import { createBrowserClient } from "@supabase/ssr";

// Cliente de navegador — respeta RLS, usa la clave pública (anon/publishable).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
