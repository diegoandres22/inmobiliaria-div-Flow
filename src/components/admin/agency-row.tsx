"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateAgency, deleteAgency } from "@/app/admin/(dashboard)/agencias/actions";

interface AgencyRowProps {
  agency: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  };
  agentCount: number;
}

// Misma grilla en el header (agencias/page.tsx) y en cada fila — así se ve
// como una tabla real en escritorio (columnas alineadas) y se apila sola en
// mobile sin duplicar el layout en dos componentes distintos.
export const AGENCY_ROW_GRID =
  "grid grid-cols-1 gap-2 md:grid-cols-[1fr_150px_140px_190px] md:items-center md:gap-4";

export function AgencyRow({ agency, agentCount }: AgencyRowProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasAgents = agentCount > 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateAgency(agency.id, formData);
        setEditing(false);
        toast.success("Agencia actualizada.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  }

  function handleDeleteConfirm() {
    setConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      try {
        await deleteAgency(agency.id);
        toast.success(`${agency.name} fue eliminada.`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        toast.error(message);
      }
    });
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className={`${AGENCY_ROW_GRID} p-4`}>
        <Input name="name" defaultValue={agency.name} required autoFocus />
        <div className="flex gap-2 md:col-span-3">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          {error && <p className="self-center text-xs text-destructive">{error}</p>}
        </div>
      </form>
    );
  }

  return (
    <div className={`${AGENCY_ROW_GRID} p-4 transition-colors hover:bg-brand-neutral/60`}>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{agency.name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{agency.slug}</p>
      </div>

      <div>
        <Badge variant={hasAgents ? "default" : "secondary"} className="gap-1">
          <Users className="size-3" />
          {agentCount} {agentCount === 1 ? "agente" : "agentes"}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground md:text-sm">
        {new Date(agency.createdAt).toLocaleDateString("es", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>

      <div className="flex flex-col items-start gap-1 md:items-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending || hasAgents}
            title={
              hasAgents
                ? "Reasigná o eliminá primero los agentes de esta agencia"
                : undefined
            }
            className="text-destructive disabled:text-muted-foreground"
            onClick={() => setConfirmOpen(true)}
          >
            Eliminar
          </Button>
        </div>
        {error && (
          <p role="alert" aria-live="assertive" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`¿Eliminar ${agency.name}?`}
        description="No se puede deshacer. Solo se puede eliminar si no tiene agentes asociados."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
