"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markLeadHandled, markLeadUnhandled } from "@/app/admin/(dashboard)/leads/actions";

export function LeadRowActions({
  leadId,
  handled,
}: {
  leadId: string;
  handled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={handled ? "ghost" : "outline"}
      disabled={isPending}
      onClick={() =>
        startTransition(() =>
          handled ? markLeadUnhandled(leadId) : markLeadHandled(leadId),
        )
      }
    >
      {handled ? "Marcar pendiente" : "Marcar atendido"}
    </Button>
  );
}
