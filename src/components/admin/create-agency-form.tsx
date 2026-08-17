"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createAgency } from "@/app/admin/(dashboard)/agencias/actions";

export function CreateAgencyForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      try {
        await createAgency(formData);
        form.reset();
        toast.success("Agencia creada.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-background p-5 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <Input name="name" placeholder="Nombre de la agencia" required />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={isPending} className="gap-1.5 sm:shrink-0">
        <Plus className="size-4" />
        {isPending ? "Creando..." : "Nueva agencia"}
      </Button>
    </form>
  );
}
