import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";

const ACTION_LABEL: Record<string, string> = {
  insert: "Alta",
  update: "Edición",
  delete: "Baja",
};

const ACTION_VARIANT: Record<string, "default" | "warning" | "destructive"> = {
  insert: "default",
  update: "warning",
  delete: "destructive",
};

const TABLE_LABEL: Record<string, string> = {
  properties: "Propiedad",
  agents: "Agente",
  leads: "Lead",
};

interface AuditPageProps {
  searchParams: Promise<{ tabla?: string }>;
}

// Quién hizo qué cambio y cuándo — solo super-agentes, cubre altas/
// ediciones/bajas de propiedades, agentes y leads (trigger log_audit_event
// en la base, ver migración add_audit_logs). El actor sale de auth.uid()
// resuelto en el momento del cambio, nunca del cliente — no se puede
// falsificar quién hizo qué.
export default async function AuditoriaPage({ searchParams }: AuditPageProps) {
  const agent = await getCurrentAgent();
  if (!agent?.isSuperAgent) redirect("/admin/propiedades");

  const { tabla } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("id, actor_email, action, table_name, record_id, diff, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (tabla) query = query.eq("table_name", tabla);

  const { data: logs } = await query;

  const tableFilters = [
    { value: undefined, label: "Todas" },
    { value: "properties", label: "Propiedades" },
    { value: "agents", label: "Agentes" },
    { value: "leads", label: "Leads" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-xl text-foreground">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Historial de altas, ediciones y bajas — propiedades, agentes y leads.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tableFilters.map((f) => (
          <a
            key={f.label}
            href={f.value ? `/admin/auditoria?tabla=${f.value}` : "/admin/auditoria"}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              tabla === f.value || (!tabla && !f.value)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-brand-accent"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {!logs || logs.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-sm text-muted-foreground">
          Todavía no hay eventos registrados.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-[var(--radius)] border border-border bg-background">
          {logs.map((log) => (
            <details key={log.id} className="group p-3">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <Badge variant={ACTION_VARIANT[log.action] ?? "default"}>
                    {ACTION_LABEL[log.action] ?? log.action}
                  </Badge>
                  <span className="text-foreground">
                    {TABLE_LABEL[log.table_name] ?? log.table_name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {log.record_id.slice(0, 8)}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {log.actor_email ?? "Sistema / público"} ·{" "}
                  {new Date(log.created_at).toLocaleString("es")}
                </span>
              </summary>
              {log.diff && (
                <pre className="mt-2 overflow-x-auto rounded-[var(--radius)] bg-brand-neutral p-3 text-xs text-foreground">
                  {JSON.stringify(log.diff, null, 2)}
                </pre>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
