import { MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/types/property";

// El RPC get_property_by_slug embebe el agente sin agencyId (ver
// PropertyDetail en types/property.ts) — este componente tampoco lo usa,
// así que el contrato pide exactamente los campos que sí llegan y renderiza,
// no el tipo Agent completo.
type ContactAgent = Pick<Agent, "id" | "name" | "email" | "phone" | "whatsapp">;

export function PropertyContactCard({
  agent,
  propertyTitle,
}: {
  agent: ContactAgent;
  propertyTitle: string;
}) {
  const message = encodeURIComponent(
    `Hola ${agent.name}, me interesa la propiedad "${propertyTitle}".`,
  );

  return (
    <div className="space-y-4 rounded-[var(--radius)] border border-border bg-background p-5 shadow-sm lg:sticky lg:top-20">
      <div>
        <p className="text-sm text-muted-foreground">Contacto</p>
        <p className="font-heading text-lg text-foreground">{agent.name}</p>
      </div>

      <div className="flex flex-col gap-2">
        {agent.whatsapp && (
          <Button asChild className="w-full">
            <a
              href={`https://wa.me/${agent.whatsapp}?text=${message}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        )}
        <Button asChild variant="outline" className="w-full">
          <a href={`tel:${agent.phone}`}>
            <Phone className="size-4" />
            {agent.phone}
          </a>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <a href={`mailto:${agent.email}`}>
            <Mail className="size-4" />
            Enviar correo
          </a>
        </Button>
      </div>
    </div>
  );
}
