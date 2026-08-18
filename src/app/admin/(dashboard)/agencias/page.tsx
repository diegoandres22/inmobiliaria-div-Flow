import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { CreateAgencyForm } from "@/components/admin/create-agency-form";
import { AgencyRow } from "@/components/admin/agency-row";

export default async function AdminAgenciesPage() {
  const currentAgent = await getCurrentAgent();
  if (!currentAgent?.isSuperAgent) {
    redirect("/admin/propiedades");
  }

  const supabase = await createClient();

  // Conteo de agentes por agencia en una query aparte (en vez de un
  // embedded select agencies(...agents(count)) ) — mismo criterio que ya
  // usa el resto del panel (ver agentes/actions.ts, propiedades/actions.ts)
  // para no depender de cómo tipa Supabase los aggregates embebidos.
  const [{ data: agencies }, { data: agentRows }] = await Promise.all([
    supabase
      .from("agencies")
      .select("id, name, slug, created_at")
      .order("name"),
    supabase.from("agents").select("agency_id"),
  ]);

  const countByAgency = new Map<string, number>();
  for (const row of agentRows ?? []) {
    countByAgency.set(row.agency_id, (countByAgency.get(row.agency_id) ?? 0) + 1);
  }

  const agencyList = agencies ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-neutral text-brand-ink">
          <Building2 className="size-5" />
        </div>
        <div>
          <h1 className="font-heading text-xl text-foreground">Agencias</h1>
          <p className="text-sm text-muted-foreground">
            Las agencias que agrupan a los agentes de la red. Solo un
            super-agente puede crearlas, editarlas o eliminarlas.
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-base text-foreground">
          Nueva agencia
        </h2>
        <CreateAgencyForm />
      </div>

      <div>
        <h2 className="mb-3 font-heading text-base text-foreground">
          Todas las agencias
          <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
            ({agencyList.length})
          </span>
        </h2>

        {agencyList.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-sm text-muted-foreground">
            Todavía no hay agencias cargadas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-background">
            <div className="divide-y divide-border">
              {agencyList.map((agency) => (
                <AgencyRow
                  key={agency.id}
                  agency={{
                    id: agency.id,
                    name: agency.name,
                    createdAt: agency.created_at,
                  }}
                  agentCount={countByAgency.get(agency.id) ?? 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
