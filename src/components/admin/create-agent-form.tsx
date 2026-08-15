"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createAgent } from "@/app/admin/(dashboard)/agentes/actions";

export function CreateAgentForm({
  agencies,
}: {
  agencies: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      try {
        const result = await createAgent(formData);
        setCreated(result);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  }

  if (created) {
    return (
      <div className="space-y-3 rounded-[var(--radius)] border border-brand-accent bg-brand-neutral p-5">
        <p className="text-sm font-medium text-foreground">
          Agente creado — guardá esta contraseña, no se puede volver a ver.
        </p>
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-background p-3 font-mono text-sm">
          <span className="text-muted-foreground">{created.email}</span>
          <span className="ml-auto">{created.tempPassword}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(created.tempPassword);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            aria-label="Copiar contraseña"
          >
            {copied ? <Check className="size-4 text-brand-accent-dark" /> : <Copy className="size-4" />}
          </button>
        </div>
        <Button variant="outline" onClick={() => setCreated(null)}>
          Crear otro agente
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-[var(--radius)] border border-border bg-background p-5 sm:grid-cols-2">
      <Input name="name" placeholder="Nombre completo" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="phone" placeholder="Teléfono (opcional)" />
      <Input name="whatsapp" placeholder="WhatsApp — solo números (opcional)" />
      <select
        name="agencyId"
        required
        className="flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground"
      >
        <option value="">Agencia...</option>
        {agencies.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isSuperAgent" className="size-4 accent-brand-accent" />
        Super-agente (control total de la red)
      </label>

      {error && <p className="sm:col-span-2 text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="sm:col-span-2">
        {isPending ? "Creando..." : "Crear agente"}
      </Button>
    </form>
  );
}
