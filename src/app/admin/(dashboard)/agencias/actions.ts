"use server";

import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { agencyFormSchema } from "@/lib/validation/agency-form";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Mismo chequeo explícito que agentes/actions.ts — mejores mensajes de
// error que depender solo del rechazo silencioso de RLS.
async function requireSuperAgent() {
  const agent = await getCurrentAgent();
  if (!agent?.isSuperAgent) {
    throw new Error("Solo un super-agente puede hacer esto.");
  }
  return agent;
}

// Nunca mostramos error.message de Postgres crudo — se loguea server-side
// para diagnosticar y se muestra un mensaje humano fijo en su lugar.
function logAndThrow(context: string, error: { message: string }, fallback: string): never {
  console.error(`[${context}]`, error.message);
  throw new Error(fallback);
}

export async function createAgency(formData: FormData) {
  await requireSuperAgent();

  const raw = Object.fromEntries(formData.entries());
  const parsed = agencyFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const values = parsed.data;
  const slug = `${slugify(values.name)}-${nanoid()}`;

  const supabase = await createClient();
  const { error } = await supabase.from("agencies").insert({
    name: values.name,
    slug,
  });

  if (error) logAndThrow("createAgency", error, "No se pudo crear la agencia. Probá de nuevo.");
  revalidatePath("/admin/agencias");
  revalidatePath("/admin/agentes");
  revalidatePath("/agencias");
}

export async function updateAgency(agencyId: string, formData: FormData) {
  await requireSuperAgent();

  const raw = Object.fromEntries(formData.entries());
  const parsed = agencyFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("agencies")
    .update({ name: values.name })
    .eq("id", agencyId);

  if (error) logAndThrow("updateAgency", error, "No se pudo guardar la agencia. Probá de nuevo.");
  revalidatePath("/admin/agencias");
  revalidatePath("/admin/agentes");
  revalidatePath("/agencias");
}

export async function deleteAgency(agencyId: string) {
  await requireSuperAgent();

  const supabase = await createClient();

  // Bloqueo explícito y con mensaje claro en vez de dejar que la FK
  // (agents_agency_id_fkey / properties_agency_id_fkey, ambas RESTRICT)
  // reviente con un error crudo de Postgres. Mismo criterio pedido: solo se
  // puede borrar si no le queda ningún agente asociado.
  const { count, error: countError } = await supabase
    .from("agents")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  if (countError) logAndThrow("deleteAgency/count", countError, "No se pudo eliminar la agencia. Probá de nuevo.");
  if ((count ?? 0) > 0) {
    throw new Error(
      `No se puede eliminar: todavía tiene ${count} agente${count === 1 ? "" : "s"} asociado${count === 1 ? "" : "s"}. Reasigná o eliminá esos agentes primero.`,
    );
  }

  const { error } = await supabase.from("agencies").delete().eq("id", agencyId);

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: esta agencia todavía tiene datos asociados (propiedades u otros registros).",
      );
    }
    logAndThrow("deleteAgency/delete", error, "No se pudo eliminar la agencia. Probá de nuevo.");
  }

  revalidatePath("/admin/agencias");
  revalidatePath("/admin/agentes");
  revalidatePath("/agencias");
}
