// Google Maps Embed API — decisión explícita del cliente sobre MapTiler/
// maplibre-gl: sin costo, sin SDK cargado en el cliente, sin billing account.
// Es un iframe de solo lectura (no hay pin arrastrable ni eventos de click),
// pero acá en la ficha pública el mapa nunca necesitó ser interactivo.
interface PropertyMapProps {
  lat: number;
  lng: number;
  title: string;
  className?: string;
}

const EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

// Sin clave configurada, no se intenta renderizar un mapa roto — mismo
// criterio que WhatsAppCTA y el footer de redes: fallback honesto, no un
// componente a medias.
export function PropertyMap({ lat, lng, title, className }: PropertyMapProps) {
  if (!EMBED_KEY) {
    return (
      <div className={className}>
        <div className="flex h-full flex-col items-center justify-center gap-1 rounded-[var(--radius)] border border-dashed border-border bg-brand-neutral p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Mapa no configurado
          </p>
          <p className="text-xs text-muted-foreground">
            Ubicación aproximada de &quot;{title}&quot; — se activa con
            NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY en producción.
          </p>
        </div>
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${EMBED_KEY}&q=${lat},${lng}&zoom=15`;

  return (
    <iframe
      src={src}
      className={className}
      style={{ border: 0 }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={`Mapa de ubicación de ${title}`}
      aria-label={`Mapa de ubicación de ${title}`}
    />
  );
}
