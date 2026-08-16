"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteProperty } from "@/app/admin/(dashboard)/propiedades/actions";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        await deleteProperty(propertyId);
        toast.success("Propiedad eliminada.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "No se pudo eliminar la propiedad.",
        );
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        aria-label="Eliminar propiedad"
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Eliminar esta propiedad?"
        description="No se puede deshacer. Se borran también sus imágenes y comodidades asociadas."
        confirmLabel="Eliminar"
        onConfirm={handleConfirm}
      />
    </>
  );
}
