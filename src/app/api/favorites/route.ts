import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateFavoritesSessionId } from "@/lib/session/favorites-session";

const bodySchema = z.object({ propertyId: z.string().uuid() });

// Toggle: si ya estaba favoriteada la saca, si no la agrega. La tabla
// favorites tiene RLS pública (session_id no está atado a auth), por eso el
// session_id sale siempre del cookie httpOnly del server, nunca del body.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "propertyId inválido" }, { status: 400 });
  }

  const sessionId = await getOrCreateFavoritesSessionId();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("session_id", sessionId)
    .eq("property_id", parsed.data.propertyId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("session_id", sessionId)
      .eq("property_id", parsed.data.propertyId);
    return NextResponse.json({ favorited: false });
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ session_id: sessionId, property_id: parsed.data.propertyId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ favorited: true });
}
