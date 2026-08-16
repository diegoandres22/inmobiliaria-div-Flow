import { createClient } from "@/lib/supabase/server";

export interface CurrentAgent {
  id: string;
  name: string;
  email: string;
  agencyId: string;
  isSuperAgent: boolean;
  photoUrl: string | null;
}

// Única puerta de entrada para "¿quién es el agente logueado y qué puede
// hacer?" — todas las páginas/actions de /admin la usan en vez de repetir
// la resolución user → agents cada vez.
export async function getCurrentAgent(): Promise<CurrentAgent | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, email, agency_id, is_super_agent, photo_path")
    .eq("auth_user_id", user.id)
    .single();

  if (!agent) return null;

  return {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    agencyId: agent.agency_id,
    isSuperAgent: agent.is_super_agent,
    photoUrl: agent.photo_path,
  };
}
