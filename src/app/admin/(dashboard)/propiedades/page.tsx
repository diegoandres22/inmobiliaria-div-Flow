import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { DeletePropertyButton } from "@/components/admin/delete-property-button";
import { StatusTransitionButtons } from "@/components/admin/status-transition-buttons";

const STATUS_LABEL: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  pausada: "Pausada",
  archivada: "Archivada",
};

export default async function AdminPropertiesPage() {
  const agent = await getCurrentAgent();
  const supabase = await createClient();

  // Super-agente: ve TODAS las propiedades de la red (con el nombre del
  // agente dueño). Agente normal: solo las suyas — la RLS ya lo garantiza,
  // pero el .eq explícito evita depender solo de la composición de políticas.
  let query = supabase
    .from("properties")
    .select(
      "id, slug, title, status, price_amount, price_currency, city, agent_id, agents ( name )",
    )
    .order("created_at", { ascending: false });

  if (agent && !agent.isSuperAgent) {
    query = query.eq("agent_id", agent.id);
  }

  const { data: properties } = agent ? await query : { data: null };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-xl text-foreground">
          {agent?.isSuperAgent ? "Todas las propiedades" : "Mis propiedades"}
        </h1>
        <Button asChild>
          <Link href="/admin/propiedades/nueva">
            <Plus className="size-4" />
            Nueva propiedad
          </Link>
        </Button>
      </div>

      {!agent && (
        <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-sm text-muted-foreground">
          Tu usuario todavía no está vinculado a un perfil de agente — pedile
          a un super-agente que te dé de alta desde{" "}
          <Link href="/admin/agentes" className="underline">
            Agentes
          </Link>
          .
        </p>
      )}

      {agent && (!properties || properties.length === 0) && (
        <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-sm text-muted-foreground">
          Todavía no hay propiedades cargadas.
        </p>
      )}

      {properties && properties.length > 0 && (
        <div className="divide-y divide-border rounded-[var(--radius)] border border-border bg-background">
          {properties.map((p) => {
            const ownerName = (p.agents as unknown as { name: string } | null)?.name;
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {p.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.city} ·{" "}
                    {new Intl.NumberFormat("es", {
                      style: "currency",
                      currency: p.price_currency,
                      maximumFractionDigits: 0,
                    }).format(p.price_amount)}
                    {agent?.isSuperAgent && ownerName && ` · ${ownerName}`}
                  </p>
                </div>
                {/* flex-wrap: antes esto era una sola fila sin wrap — badge +
                    hasta 3 botones de estado + editar + borrar no entraban
                    nunca en un viewport mobile y desbordaban. Ahora pasan a
                    una segunda línea en vez de romper el layout. */}
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:gap-3">
                  <Badge
                    variant={p.status === "publicada" ? "default" : "secondary"}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                  <StatusTransitionButtons propertyId={p.id} status={p.status} />
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={`/admin/propiedades/${p.id}`}
                      aria-label="Editar propiedad"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <DeletePropertyButton propertyId={p.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
