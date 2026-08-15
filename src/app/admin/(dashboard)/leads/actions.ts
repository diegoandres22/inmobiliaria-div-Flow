"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markLeadHandled(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ handled_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}

export async function markLeadUnhandled(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ handled_at: null })
    .eq("id", leadId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}
