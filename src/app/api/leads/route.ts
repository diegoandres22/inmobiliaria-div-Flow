import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { leadSchema } from "@/lib/validation/lead-schema";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hashIp } from "@/lib/security/hash-ip";
import { isSameOrigin } from "@/lib/security/same-origin";
import { createAdminClient } from "@/lib/supabase/admin";

// Rechaza envíos más rápidos de lo humanamente posible para completar el form.
const MIN_FILL_TIME_MS = 1500;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen inválido" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { website, formRenderedAt, ...lead } = parsed.data;

  const isHoneypotTriggered = Boolean(website);
  const isTooFast = Date.now() - formRenderedAt < MIN_FILL_TIME_MS;

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  const { success: withinRateLimit } = await checkRateLimit(ipHash, 5, 60_000);
  if (!withinRateLimit) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en un minuto." },
      { status: 429 },
    );
  }

  // A un bot detectado le respondemos 200 igual (sin señal de que lo
  // detectamos), pero no escribimos el lead real.
  if (isHoneypotTriggered || isTooFast) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").insert({
    property_id: lead.propertyId ?? null,
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? null,
    message: lead.message ?? null,
    source: lead.source,
    honeypot_flag: false,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("leads insert error:", error.message);
    return NextResponse.json(
      { error: "No pudimos guardar tu mensaje. Probá de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
