import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";

// Los route handlers NO heredan la protección de layout.tsx (esa solo
// aplica al árbol de páginas) — middleware.ts sí cubre esta ruta por path
// (bloquea sin sesión), pero acá además se valida que la sesión tenga un
// agente vinculado, igual que en el resto de las mutaciones admin.
function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  const agent = await getCurrentAgent();
  if (!agent) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select(
      "name, email, phone, message, source, honeypot_flag, handled_at, created_at, properties ( title )",
    )
    .order("created_at", { ascending: false });

  const header = [
    "Nombre",
    "Email",
    "Teléfono",
    "Mensaje",
    "Origen",
    "Spam",
    "Atendido",
    "Fecha",
    "Propiedad",
  ];

  const rows = (leads ?? []).map((l) => [
    l.name,
    l.email,
    l.phone ?? "",
    l.message ?? "",
    l.source,
    l.honeypot_flag ? "Sí" : "No",
    l.handled_at ? "Sí" : "No",
    new Date(l.created_at).toISOString(),
    (l.properties as unknown as { title: string } | null)?.title ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  // BOM al principio para que Excel detecte UTF-8 y no rompa acentos/ñ.
  const body = "﻿" + csv;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
