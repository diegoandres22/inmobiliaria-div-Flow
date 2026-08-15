"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updatePropertyStatus } from "@/app/admin/(dashboard)/propiedades/actions";

const NEXT_STEPS: Record<string, { status: string; label: string }[]> = {
  borrador: [{ status: "publicada", label: "Publicar" }],
  publicada: [
    { status: "pausada", label: "Pausar" },
    { status: "archivada", label: "Archivar" },
  ],
  pausada: [
    { status: "publicada", label: "Republicar" },
    { status: "archivada", label: "Archivar" },
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
            startTransition(() =>
              updatePropertyStatus(propertyId, status, step.status),
            )
          }
        >
          {step.label}
        </Button>
      ))}
    </div>
  );
}
