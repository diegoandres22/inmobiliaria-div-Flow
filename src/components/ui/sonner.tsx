"use client";

// sonner en vez de un sistema de toasts armado a mano: ~2.7kB gzip, cero
// dependencias, sin conflicto con Radix (usan portales distintos). Reemplaza
// tanto los window.confirm() de antes (ahora dan feedback vía ConfirmDialog +
// este toast post-acción) como los console.error silenciosos que dejaban al
// agente sin saber si algo falló.
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-[var(--radius)] border border-border bg-background text-foreground shadow-lg font-sans",
          title: "text-sm font-medium text-foreground",
          description: "text-xs text-muted-foreground",
          actionButton:
            "rounded-[var(--radius)] bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 hover:bg-brand-accent-dark hover:text-brand-paper",
          cancelButton:
            "rounded-[var(--radius)] bg-brand-neutral text-foreground text-xs px-3 py-1.5",
          closeButton:
            "bg-background border-border text-muted-foreground hover:text-foreground",
          success: "border-brand-accent-dark/30",
          error: "border-destructive/40",
          warning: "border-warning/50",
        },
      }}
      {...props}
    />
  );
}
