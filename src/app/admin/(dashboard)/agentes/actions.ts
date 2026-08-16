"use server";

import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { agentFormSchema } from "@/lib/validation/agent-form";

const genPassword = customAlphabet(
  "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%",
  16,
);

// Chequeo explícito además de RLS — mejores mensajes de error, y evita
// tocar auth.users (que RLS no puede proteger, es la API de Supabase Auth).
async function requireSuperAgent() {
  const agent = await getCurrentAgent();
  if (!agent?.isSuperAgent) {
    throw new Error("Solo un super-agente puede hacer esto.");
  }
  return agent;
}

export async function createAgent(
  formData: FormData,
): Promise<{ email: string; tempPassword: string }> {
  await requireSuperAgent();

  const raw = Object.fromEntries(formData.entries());
  const parsed = agentFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const values = parsed.data;
  const tempPassword = genPassword();

  // Crear la cuenta de acceso requiere el API de administración de Supabase
  // Auth (auth.users no es una tabla con RLS normal) — por eso el service
  // role acá, recién DESPUÉS de confirmar que quien llama es super-agente.
  const adminClient = createAdminClient();
  const { data: created, error: authError } =
    await adminClient.auth.admin.createUser({
      email: values.email,
      password: tempPassword,
      email_confirm: true,
    });

  if (authError || !created.user) {
    throw new Error(authError?.message ?? "No se pudo crear la cuenta de acceso.");
  }

  // El insert en agents pasa por el cliente normal (RLS): la policy
  // super_agents_manage_agents ya permite esto porque quien llama es
  // super-agente.
  const supabase = await createClient();
  const { error: insertError } = await supabase.from("agents").insert({
    auth_user_id: created.user.id,
    name: values.name,
    email: values.email,
    // phone es NOT NULL en la base (a diferencia de whatsapp) — "" en vez de
    // null si el campo vino vacío. Antes de tipar el cliente con Database
    // esto compilaba igual pero habría roto el insert en runtime con una
    // violación de constraint apenas alguien dejara el teléfono en blanco.
    phone: values.phone || "",
    whatsapp: values.whatsapp || null,
    agency_id: values.agencyId,
    is_super_agent: values.isSuperAgent,
  });

  if (insertError) {
    // Rollback best-effort: si falla la fila de agents, no dejar una cuenta
    // de auth huérfana sin agente asociado.
    await adminClient.auth.admin.deleteUser(created.user.id);
    throw new Error(insertError.message);
  }

  revalidatePath("/admin/agentes");
  return { email: values.email, tempPassword };
}

export async function updateAgent(agentId: string, formData: FormData) {
  const currentAgent = await requireSuperAgent();

  const raw = Object.fromEntries(formData.entries());
  const parsed = agentFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const values = parsed.data;

  // No dejar que el único super-agente se saque el rol a sí mismo —
  // bloquearía la gestión de agentes para siempre.
  if (
    agentId === currentAgent.id &&
    !values.isSuperAgent
  ) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("is_super_agent", true);
    if ((count ?? 0) <= 1) {
      throw new Error("Sos el único super-agente — no podés quitarte el rol.");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("agents")
    .update({
      name: values.name,
      email: values.email,
      phone: values.phone || "",
      whatsapp: values.whatsapp || null,
      agency_id: values.agencyId,
      is_super_agent: values.isSuperAgent,
    })
    .eq("id", agentId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/agentes");
}

export async function deleteAgent(agentId: string) {
  const currentAgent = await requireSuperAgent();

  if (agentId === currentAgent.id) {
    throw new Error("No podés eliminar tu propia cuenta desde acá.");
  }

  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("auth_user_id")
    .eq("id", agentId)
    .single();

  // properties.agent_id es NOT NULL con FK ON DELETE RESTRICT a propósito
  // (nunca perder un listado por accidente al borrar un agente). En vez de
  // bloquear el borrado, transferimos sus propiedades al super-agente que
  // ejecuta la acción — así el agente se puede eliminar siempre y ningún
  // listado queda huérfano ni se pierde en el camino.
  const { data: reassigned, error: reassignError } = await supabase
    .from("properties")
    .update({ agent_id: currentAgent.id })
    .eq("agent_id", agentId)
    .select("id");

  if (reassignError) throw new Error(reassignError.message);
  const reassignedCount = reassigned?.length ?? 0;

  const { error } = await supabase.from("agents").delete().eq("id", agentId);

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: este agente todavía tiene datos asociados que no se pudieron transferir.",
      );
    }
    throw new Error(error.message);
  }

  if (agent?.auth_user_id) {
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(agent.auth_user_id);
  }

  revalidatePath("/admin/agentes");
  revalidatePath("/admin/propiedades");
  revalidatePath("/admin");

  return { reassignedProperties: reassignedCount ?? 0 };
}
