import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Car, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/property/favorite-button";
import { CompareButton } from "@/components/property/compare-button";
import type { OperationType, PropertyListItem } from "@/types/property";

const OPERATION_LABEL: Record<OperationType, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};

function formatPrice(property: PropertyListItem) {
  const amount = new Intl.NumberFormat("es", {
    style: "currency",
    currency: property.priceCurrency,
    maximumFractionDigits: 0,
  }).format(property.priceAmount);
  return property.pricePeriod === "mensual" ? `${amount}/mes` : amount;
}

export function PropertyCard({
  property,
  isFavorite = false,
  priority = false,
}: {
  property: PropertyListItem;
  isFavorite?: boolean;
  // Solo la primera card del grid "destacadas" (candidata a LCP) debe
  // cargar eager/alta prioridad — el resto sigue lazy por defecto.
  priority?: boolean;
}) {
  return (
    <Link
      href={`/propiedades/${property.slug}`}
      className="group block overflow-hidden rounded-[var(--radius)] border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/60 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-neutral">
        {property.coverImageUrl && (
          <Image
            src={property.coverImageUrl}
            alt={property.coverImageAlt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            priority={priority}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Badge className="absolute top-3 left-3">
          {OPERATION_LABEL[property.operationType]}
        </Badge>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <FavoriteButton propertyId={property.id} initialFavorite={isFavorite} />
          <CompareButton propertyId={property.id} />
        </div>
      </div>

      <div className="space-y-2 p-4">
        <p className="font-heading text-lg text-foreground transition-colors group-hover:text-brand-accent-dark">
          {formatPrice(property)}
        </p>
        <h3 className="line-clamp-1 text-sm font-medium text-foreground">
          {property.title}
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {property.city}, {property.stateRegion}
        </p>
        <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" /> {property.bedrooms}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" /> {property.bathrooms}
          </span>
          {property.parkingSpots > 0 && (
            <span className="flex items-center gap-1">
              <Car className="size-3.5" /> {property.parkingSpots}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
