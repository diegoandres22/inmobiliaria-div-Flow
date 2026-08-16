"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updatePropertyStatus } from "@/app/admin/(dashboard)/propiedades/actions";

const NEXT_STEPS: Record<string, { status: string; label: string; doneLabel: string }[]> = {
  borrador: [{ status: "publicada", label: "Publicar", doneLabel: "publicada" }],
  publicada: [
    { status: "pausada", label: "Pausar", doneLabel: "pausada" },
    { status: "archivada", label: "Archivar", doneLabel: "archivada" },
  ],
  pausada: [
    { status: "publicada", label: "Republicar", doneLabel: "republicada" },
    { status: "archivada", label: "Archivar", doneLabel: "archivada" },
  ],
  archivada: [],
};

export function StatusTransitionButtons({
  propertyId,
  status,
}: {
  propertyId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const steps = NEXT_STEPS[status] ?? [];

  if (steps.length === 0) return null;

  return (
    <div className="flex gap-1.5">
      {steps.map((step) => (
        <Button
          key={step.status}
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                await updatePropertyStatus(propertyId, status, step.status);
                toast.success(`Propiedad ${step.doneLabel}.`);
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "No se pudo actualizar el estado.",
                );
              }
            })
          }
        >
          {step.label}
        </Button>
      ))}
    </div>
  );
}
