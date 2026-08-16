"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Auditoría 2026-08-15 (A2): estas tres acciones no chequeaban nada a nivel
// app, dependían 100% de RLS. Ahora que la policy de `leads` está scopeada
// por agencia/propiedad (fix del hallazgo C1), un intento sobre un lead ajeno
// hace que el UPDATE/DELETE afecte 0 filas — sin `.select()` eso pasaba
// silencioso y la UI mostraba éxito igual. Se pide de vuelta la fila tocada
// y si no vino ninguna, se informa un error real en vez de un falso éxito.
export async function markLeadHandled(leadId: string) {
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("leads")
    .update({ handled_at: new Date().toISOString() })
    .eq("id", leadId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("No se pudo actualizar: no tenés permiso sobre este lead.");
  }
  revalidatePath("/admin/leads");
}

export async function markLeadUnhandled(leadId: string) {
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("leads")
    .update({ handled_at: null })
    .eq("id", leadId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("No se pudo actualizar: no tenés permiso sobre este lead.");
  }
  revalidatePath("/admin/leads");
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("No se pudo eliminar: no tenés permiso sobre este lead.");
  }
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
