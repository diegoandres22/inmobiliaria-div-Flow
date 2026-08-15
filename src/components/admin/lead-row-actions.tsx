"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  markLeadHandled,
  markLeadUnhandled,
  deleteLead,
} from "@/app/admin/(dashboard)/leads/actions";

export function LeadRowActions({
  leadId,
  handled,
}: {
  leadId: string;
  handled: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggleHandled() {
    startTransition(async () => {
      try {
        await (handled ? markLeadUnhandled(leadId) : markLeadHandled(leadId));
        toast.success(handled ? "Marcado como pendiente." : "Marcado como atendido.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo actualizar el lead.");
      }
    });
  }

  function handleDeleteConfirm() {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        await deleteLead(leadId);
        toast.success("Lead eliminado.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo eliminar el lead.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={handled ? "ghost" : "outline"}
        disabled={isPending}
        onClick={handleToggleHandled}
      >
        {handled ? "Marcar pendiente" : "Marcar atendido"}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        disabled={isPending}
        aria-label="Eliminar lead"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Eliminar este lead?"
        description="No se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
