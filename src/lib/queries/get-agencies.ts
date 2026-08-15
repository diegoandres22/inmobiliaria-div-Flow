import { createClient } from "@/lib/supabase/server";

export interface AgencyWithAgents {
  id: string;
  slug: string;
  name: string;
  logoPath: string | null;
  agents: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    whatsapp: string | null;
    photoPath: string | null;
  }[];
}

// agencies/agents tienen RLS pública de solo lectura (public_read_agencies,
// public_read_agents) — es información de contacto pensada para mostrarse.
export async function getAgenciesWithAgents(): Promise<AgencyWithAgents[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agencies")
    .select(
      "id, slug, name, logo_path, agents ( id, name, email, phone, whatsapp, photo_path )",
    )
    .order("name");

  if (error || !data) {
    console.error("getAgenciesWithAgents error:", error?.message);
    return [];
  }

  return data.map((agency) => ({
    id: agency.id,
    slug: agency.slug,
    name: agency.name,
    logoPath: agency.logo_path,
    agents: (
      agency.agents as {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        whatsapp: string | null;
        photo_path: string | null;
      }[]
    ).map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      whatsapp: a.whatsapp,
      photoPath: a.photo_path,
    })),
  }));
}
