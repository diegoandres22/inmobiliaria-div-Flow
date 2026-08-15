"use client";

// Compartir la ficha con clientes reales — WhatsApp (con los datos que
// importan a primera vista ya escritos en el mensaje) y copiar link (con
// feedback visual, nunca un alert nativo). Mejora extra: si el dispositivo
// soporta la Web Share API (la mayoría de los móviles), se suma un tercer
// botón que abre la hoja de compartir nativa del SO — no reemplaza a los dos
// pedidos, es un atajo adicional que solo aparece cuando el navegador lo
// soporta (feature detection, sin librerías).
import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { clientConfig } from "@/config/client.config";

interface SharePropertyProps {
  slug: string;
  title: string;
  priceLabel: string;
  city: string;
  stateRegion: string;
  bedrooms: number;
  bathrooms: number;
  areaBuiltM2: number;
  className?: string;
}

const ICON_BUTTON_CLASS =
  "flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-105";

export function ShareProperty({
  slug,
  title,
  priceLabel,
  city,
  stateRegion,
  bedrooms,
  bathrooms,
  areaBuiltM2,
  className,
}: SharePropertyProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const url = `${clientConfig.seo.siteUrl}/propiedades/${slug}`;

  // navigator.share solo existe en el cliente y solo en algunos navegadores
  // (sobre todo móviles) — se detecta después del mount para no romper SSR.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const specs = [
    bedrooms > 0 ? `${bedrooms} hab` : null,
    `${bathrooms} baños`,
    `${areaBuiltM2} m²`,
  ]
    .filter(Boolean)
    .join(" · ");

  const message = [`${title}`, `${priceLabel} · ${city}, ${stateRegion}`, specs, url].join(
    "\n",
  );

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Enlace copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace — copialo manualmente.");
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, text: `${priceLabel} · ${city}, ${stateRegion}`, url });
    } catch {
      // El usuario cerró la hoja de compartir o el navegador la canceló —
      // no es un error real, no hace falta un toast.
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir por WhatsApp"
        title="Compartir por WhatsApp"
        className={cn(ICON_BUTTON_CLASS, "hover:text-[#25D366]")}
      >
        <MessageCircle className="size-4" />
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
        title={copied ? "Enlace copiado" : "Copiar enlace"}
        className={cn(ICON_BUTTON_CLASS, copied && "bg-primary text-primary-foreground")}
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label="Más opciones para compartir"
          title="Más opciones para compartir"
          className={ICON_BUTTON_CLASS}
        >
          <Share2 className="size-4" />
        </button>
      )}
    </div>
  );
}
