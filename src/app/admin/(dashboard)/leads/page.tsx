import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadRowActions } from "@/components/admin/lead-row-actions";
import { createClient } from "@/lib/supabase/server";

interface LeadsPageProps {
  searchParams: Promise<{ spam?: string; estado?: string }>;
}

export default async function AdminLeadsPage({ searchParams }: LeadsPageProps) {
  const { spam, estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("id, name, email, phone, message, source, honeypot_flag, handled_at, created_at, property_id, properties ( title, slug )")
    .order("created_at", { ascending: false });

  if (spam === "1") query = query.eq("honeypot_flag", true);
  if (spam === "0") query = query.eq("honeypot_flag", false);
  if (estado === "pendiente") query = query.is("handled_at", null);
  if (estado === "atendido") query = query.not("handled_at", "is", null);

  const { data: leads } = await query;

  const filterLink = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { spam, estado, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/admin/leads${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl text-foreground">Leads</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant={!estado ? "default" : "outline"} size="sm" asChild>
            <Link href={filterLink({ estado: undefined })}>Todos</Link>
          </Button>
          <Button variant={estado === "pendiente" ? "default" : "outline"} size="sm" asChild>
            <Link href={filterLink({ estado: "pendiente" })}>Pendientes</Link>
          </Button>
          <Button variant={estado === "atendido" ? "default" : "outline"} size="sm" asChild>
            <Link href={filterLink({ estado: "atendido" })}>Atendidos</Link>
          </Button>
          <Button variant={spam === "1" ? "default" : "outline"} size="sm" asChild>
            <Link href={filterLink({ spam: spam === "1" ? undefined : "1" })}>
              Solo spam
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/leads/export">Exportar CSV</a>
          </Button>
        </div>
      </div>

      {!leads || leads.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-sm text-muted-foreground">
          No hay leads con estos filtros.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-[var(--radius)] border border-border bg-background">
          {leads.map((lead) => {
            const property = lead.properties as unknown as
              | { title: string; slug: string }
              | null;
            return (
              <div key={lead.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {lead.name}
                      {lead.honeypot_flag && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="size-3" /> Spam
                        </Badge>
                      )}
                      {lead.handled_at ? (
                        <Badge variant="secondary">Atendido</Badge>
                      ) : (
                        <Badge variant="warning">Pendiente</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.email} {lead.phone ? `· ${lead.phone}` : ""} ·{" "}
                      {new Date(lead.created_at).toLocaleString("es")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Origen: {lead.source}
                      {property && (
                        <>
                          {" "}
                          ·{" "}
                          <Link
                            href={`/propiedades/${property.slug}`}
                            className="underline hover:text-brand-accent-dark"
                            target="_blank"
                          >
                            {property.title}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <LeadRowActions leadId={lead.id} handled={Boolean(lead.handled_at)} />
                </div>
                {lead.message && (
                  <p className="rounded-[var(--radius)] bg-brand-neutral p-3 text-sm text-foreground">
                    {lead.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
