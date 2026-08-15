import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { CreateAgentForm } from "@/components/admin/create-agent-form";
import { AgentRow } from "@/components/admin/agent-row";

export default async function AdminAgentsPage() {
  const currentAgent = await getCurrentAgent();
  if (!currentAgent?.isSuperAgent) {
    redirect("/admin/propiedades");
  }

  const supabase = await createClient();
  const [{ data: agencies }, { data: agents }] = await Promise.all([
    supabase.from("agencies").select("id, name").order("name"),
    supabase
      .from("agents")
      .select("id, name, email, phone, whatsapp, agency_id, is_super_agent, agencies ( name )")
      .order("name"),
  ]);

  const agencyList = agencies ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-xl text-foreground">Agentes</h1>
        <p className="text-sm text-muted-foreground">
          Solo vos, como super-agente, podés dar de alta agentes y asignar
          quién más tiene ese rol.
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-base text-foreground">
          Nuevo agente
        </h2>
        <CreateAgentForm agencies={agencyList} />
      </div>

      <div>
        <h2 className="mb-3 font-heading text-base text-foreground">
          Todos los agentes
        </h2>
        <div className="divide-y divide-border rounded-[var(--radius)] border border-border bg-background">
          {(agents ?? []).map((agent) => (
            <AgentRow
              key={agent.id}
              agent={{
                id: agent.id,
                name: agent.name,
                email: agent.email,
                phone: agent.phone,
                whatsapp: agent.whatsapp,
                agencyId: agent.agency_id,
                isSuperAgent: agent.is_super_agent,
              }}
              agencies={agencyList}
              agencyName={(agent.agencies as unknown as { name: string } | null)?.name ?? "—"}
              isSelf={agent.id === currentAgent.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
