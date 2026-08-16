"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/app/admin/olvide-password/actions";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("error") === "expired";

  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await requestPasswordReset(formData);
      // Siempre "enviado", exista o no la cuenta — ver comentario en
      // olvide-password/actions.ts sobre por qué nunca se distingue acá.
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-foreground">
        Si ese email tiene una cuenta con nosotros, te mandamos un enlace para
        elegir una contraseña nueva. Revisá tu bandeja de entrada (y spam) —
        el enlace vale por poco tiempo y se puede usar una sola vez.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {expired && (
        <p role="alert" aria-live="assertive" className="text-sm text-destructive">
          Ese enlace venció o ya se usó. Pedí uno nuevo acá abajo.
        </p>
      )}
      <Input name="email" type="email" placeholder="Email" required autoFocus />
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
      </Button>
    </form>
  );
}
