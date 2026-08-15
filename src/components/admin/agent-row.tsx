"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateAgent, deleteAgent } from "@/app/admin/(dashboard)/agentes/actions";

interface AgentRowProps {
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    whatsapp: string | null;
    agencyId: string;
    isSuperAgent: boolean;
  };
  agencies: { id: string; name: string }[];
  agencyName: string;
  isSelf: boolean;
}

export function AgentRow({ agent, agencies, agencyName, isSelf }: AgentRowProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateAgent(agent.id, formData);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <Input name="name" defaultValue={agent.name} required />
        <Input name="email" type="email" defaultValue={agent.email} required />
        <Input name="phone" defaultValue={agent.phone ?? ""} placeholder="Teléfono" />
        <Input name="whatsapp" defaultValue={agent.whatsapp ?? ""} placeholder="WhatsApp" />
        <select
          name="agencyId"
          defaultValue={agent.agencyId}
          required
          className="flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground"
        >
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="isSuperAgent"
            defaultChecked={agent.isSuperAgent}
            className="size-4 accent-brand-accent"
          />
          Super-agente
        </label>
        {error && <p className="sm:col-span-2 text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          {agent.name}
          {agent.isSuperAgent && <Badge>Super-agente</Badge>}
          {isSelf && <span className="text-xs text-muted-foreground">(vos)</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {agent.email} · {agencyName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Editar
        </Button>
        {!isSelf && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="text-destructive"
            onClick={() => {
              if (!confirm(`¿Eliminar a ${agent.name}? No se puede deshacer.`)) return;
              startTransition(() => deleteAgent(agent.id));
            }}
          >
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
