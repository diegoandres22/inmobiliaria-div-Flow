"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PropertyLeadForm({ propertyId }: { propertyId: string }) {
  const [renderedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? "") || undefined,
      message: String(form.get("message") ?? "") || undefined,
      propertyId,
      website: String(form.get("website") ?? ""),
      formRenderedAt: renderedAt,
    };

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setStatus(res.ok ? "sent" : "error");
    if (res.ok) e.currentTarget.reset();
  }

  if (status === "sent") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-[var(--radius)] border border-brand-accent bg-brand-neutral p-4 text-sm text-foreground"
      >
        Mensaje enviado — el agente te va a contactar pronto.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        ¿Preguntas? Escribile al agente
      </p>
      <Input name="name" placeholder="Tu nombre" required />
      <Input name="email" type="email" placeholder="Tu email" required />
      <Input name="phone" placeholder="Teléfono (opcional)" />
      <textarea
        name="message"
        placeholder="Contame qué te interesa de esta propiedad..."
        rows={3}
        className="flex w-full rounded-[var(--radius)] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {/* Honeypot — oculto vía CSS (no display:none, algunos bots lo detectan) */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">No completar</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {/* Aviso de privacidad en el punto de recolección — antes la Política
          de Privacidad existía como página aislada sin que nada la
          referenciara desde donde realmente se piden los datos. */}
      <p className="text-xs text-muted-foreground">
        Al enviar este formulario aceptás nuestra{" "}
        <Link href="/legal/privacidad" className="underline hover:text-brand-accent-dark">
          Política de Privacidad
        </Link>
        .
      </p>
      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Enviar mensaje"}
      </Button>
      {status === "error" && (
        <p role="alert" aria-live="assertive" className="text-xs text-destructive">
          Algo salió mal. Probá de nuevo en unos segundos.
        </p>
      )}
    </form>
  );
}
