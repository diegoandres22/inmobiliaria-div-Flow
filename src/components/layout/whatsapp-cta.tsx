import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppCTAProps {
  // Formato E.164 sin "+", ej. "584121234567". TODO(FASE FINAL): client.config.ts
  phoneNumber?: string;
  message?: string;
  className?: string;
}

// Sin número configurado, no se renderiza — nunca un botón que lleve a ningún lado.
// Solo mobile (md:hidden): en desktop el contacto va por el header/footer, no flotante.
export function WhatsAppCTA({
  phoneNumber,
  message = "Hola, quiero más información sobre una propiedad.",
  className,
}: WhatsAppCTAProps) {
  if (!phoneNumber) return null;

  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className={cn(
        "fixed bottom-4 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:hidden",
        className,
      )}
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
