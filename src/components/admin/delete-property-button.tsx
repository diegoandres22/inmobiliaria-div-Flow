"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProperty } from "@/app/admin/(dashboard)/propiedades/actions";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!confirm("¿Eliminar esta propiedad? No se puede deshacer.")) return;
        startTransition(() => deleteProperty(propertyId));
      }}
      aria-label="Eliminar propiedad"
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
