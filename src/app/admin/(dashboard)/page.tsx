import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUS_LABEL: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  pausada: "Pausada",
  archivada: "Archivada",
};

// Métricas globales de la red (no filtradas por agente) — es la vista de
// panorama general del panel admin.
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  // Conteos globales por status: RLS solo deja ver borrador/pausada/
  // archivada propios vía el cliente normal (correcto para privacidad entre
  // agencias). El dashboard es una vista agregada de panorama general, ya
  // detrás de /admin, así que acá sí se usa el cliente admin — nunca se
  // expone una fila completa, solo conteos.
  const adminSupabase = createAdminClient();

  const [{ data: properties }, { data: recentLeads }, { count: pendingLeadsCount }] =
    await Promise.all([
      adminSupabase.from("properties").select("status, view_count"),
      supabase
        .from("leads")
        .select("id, name, email, source, honeypot_flag, handled_at, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("handled_at", null)
        .eq("honeypot_flag", false),
    ]);

  const statusCounts: Record<string, number> = {
    borrador: 0,
    publicada: 0,
    pausada: 0,
    archivada: 0,
  };
  let totalViews = 0;
  for (const p of properties ?? []) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    totalViews += p.view_count ?? 0;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-xl text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Panorama general de la red — todas las agencias.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div
            key={status}
            className="rounded-[var(--radius)] border border-border bg-background p-4"
          >
            <p className="text-2xl font-heading text-foreground">{count}</p>
            <p className="text-xs text-muted-foreground">
              {STATUS_LABEL[status] ?? status}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-border bg-background p-4">
          <p className="text-2xl font-heading text-foreground">{totalViews}</p>
          <p className="text-xs text-muted-foreground">Vistas acumuladas</p>
        </div>
        <Link
          href="/admin/leads?estado=pendiente"
          className="rounded-[var(--radius)] border border-border bg-background p-4 hover:border-brand-accent"
        >
          <p className="text-2xl font-heading text-foreground">
            {pendingLeadsCount ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">
            Leads pendientes (sin spam)
          </p>
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-base text-foreground">
            Leads recientes
          </h2>
          <Link
            href="/admin/leads"
            className="text-sm text-brand-accent-dark hover:underline"
          >
            Ver todos
          </Link>
        </div>
        {!recentLeads || recentLeads.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-sm text-muted-foreground">
            Todavía no hay leads.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-[var(--radius)] border border-border bg-background">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {lead.name}
                    {lead.honeypot_flag && (
                      <span className="ml-2 text-xs text-destructive">
                        spam
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.email} · {lead.source}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground sm:shrink-0">
                  {new Date(lead.created_at).toLocaleDateString("es")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
