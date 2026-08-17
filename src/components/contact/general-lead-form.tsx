"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Mismo endpoint/contrato que PropertyLeadForm pero sin propertyId — el
// API route ya inserta property_id = NULL cuando no viene, que es
// exactamente el caso de "consulta general" descrito en el contexto del
// proyecto (leads.property_id puede ser NULL).
export function GeneralLeadForm() {
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
      source: "contacto",
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
        className="rounded-[var(--radius)] border border-brand-accent bg-brand-neutral p-6 text-sm text-foreground"
      >
        Gracias — recibimos tu mensaje y te vamos a contactar pronto.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input name="name" placeholder="Tu nombre" required />
        <Input name="email" type="email" placeholder="Tu email" required />
      </div>
      <Input name="phone" placeholder="Teléfono (opcional)" />
      <textarea
        name="message"
        placeholder="Contanos qué estás buscando..."
        rows={5}
        required
        className="flex w-full rounded-[var(--radius)] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {/* Honeypot — mismo patrón que PropertyLeadForm */}
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
