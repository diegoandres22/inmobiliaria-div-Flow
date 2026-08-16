import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PropertyImageManager } from "@/components/admin/property-image-manager";
import { createClient } from "@/lib/supabase/server";
import { getAmenities } from "@/lib/queries/get-amenities";
import { updateProperty } from "../actions";

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; imageErrors?: string }>;
}

export default async function EditPropertyPage({
  params,
  searchParams,
}: EditPropertyPageProps) {
  const { id } = await params;
  const { created, imageErrors } = await searchParams;
  const supabase = await createClient();

  const [
    { data: property },
    { data: images },
    { data: selectedAmenities },
    { categories, amenities },
    { data: coords },
  ] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id, title, description, operation_type, property_type, price_amount, price_period, bedrooms, bathrooms, parking_spots, area_built_m2, address_line, city, state_region, country_code",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("property_images")
      .select("id, storage_path, alt_text, is_cover")
      .eq("property_id", id)
      .order("sort_order"),
    supabase.from("property_amenities").select("amenity_id").eq("property_id", id),
    getAmenities(),
    supabase.rpc("get_property_coordinates", { p_property_id: id }),
  ]);

  if (!property) notFound();

  const coordinates = coords?.[0] as { lat: number; lng: number } | undefined;

  const selectedIds = new Set((selectedAmenities ?? []).map((a) => a.amenity_id));
  const updatePropertyWithId = updateProperty.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-heading text-xl text-foreground">
        Editar propiedad
      </h1>

      {created === "1" && (
        <p
          role="status"
          aria-live="polite"
          className="mb-6 rounded-[var(--radius)] border border-brand-accent bg-brand-neutral p-3 text-sm text-foreground"
        >
          Propiedad creada correctamente — queda como borrador hasta que la publiques.
        </p>
      )}
      {imageErrors && (
        <p
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          La propiedad se creó, pero algunas fotos no se pudieron subir: {imageErrors}. Probá subirlas de nuevo acá abajo.
        </p>
      )}

      <div className="mb-8 space-y-2">
        <label className="text-sm font-medium text-foreground">
          Fotos
        </label>
        <PropertyImageManager
          propertyId={id}
          images={(images ?? []).map((img) => ({
            id: img.id,
            url: img.storage_path,
            alt: img.alt_text ?? property.title,
            isCover: img.is_cover,
          }))}
        />
      </div>

      <form action={updatePropertyWithId} className="space-y-4">
        <Input name="title" placeholder="Título" defaultValue={property.title} required />
        <textarea
          name="description"
          placeholder="Descripción"
          rows={4}
          required
          defaultValue={property.description}
          className="flex w-full rounded-[var(--radius)] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Operación</label>
            <select
              name="operationType"
              required
              defaultValue={property.operation_type}
              className="flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground"
            >
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="alquiler_temporal">Alquiler temporal</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <select
              name="propertyType"
              required
              defaultValue={property.property_type}
              className="flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground"
            >
              <option value="casa">Casa</option>
              <option value="apartamento">Apartamento</option>
              <option value="local_comercial">Local comercial</option>
              <option value="oficina">Oficina</option>
              <option value="terreno">Terreno</option>
              <option value="edificio">Edificio</option>
              <option value="finca">Finca</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            name="priceAmount"
            type="number"
            placeholder="Precio (USD)"
            defaultValue={property.price_amount}
            required
          />
          <select
            name="pricePeriod"
            defaultValue={property.price_period ?? ""}
            className="flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground"
          >
            <option value="">Único (venta)</option>
            <option value="mensual">Mensual (alquiler)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input name="bedrooms" type="number" placeholder="Habitaciones" defaultValue={property.bedrooms} />
          <Input name="bathrooms" type="number" step="0.5" placeholder="Baños" defaultValue={property.bathrooms} />
          <Input name="parkingSpots" type="number" placeholder="Estac." defaultValue={property.parking_spots} />
          <Input name="areaBuiltM2" type="number" placeholder="m² construidos" defaultValue={property.area_built_m2} required />
        </div>

        <Input name="addressLine" placeholder="Dirección" defaultValue={property.address_line} required />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input name="city" placeholder="Ciudad" defaultValue={property.city} required />
          <Input name="stateRegion" placeholder="Estado/Región" defaultValue={property.state_region} required />
          <Input name="countryCode" placeholder="País (MX, CO...)" maxLength={2} defaultValue={property.country_code} required />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            name="lat"
            type="number"
            step="any"
            placeholder="Latitud"
            defaultValue={coordinates?.lat}
            required
          />
          <Input
            name="lng"
            type="number"
            step="any"
            placeholder="Longitud"
            defaultValue={coordinates?.lng}
            required
          />
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Comodidades</p>
          {categories.map((category) => {
            const items = amenities.filter((a) => a.categoryId === category.id);
            if (items.length === 0) return null;
            return (
              <div key={category.id} className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {category.name}
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {items.map((amenity) => (
                    <label
                      key={amenity.id}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        name="amenities"
                        value={amenity.id}
                        defaultChecked={selectedIds.has(amenity.id)}
                        className="size-4 accent-brand-accent"
                      />
                      {amenity.name}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Button type="submit" className="w-full">
          Guardar cambios
        </Button>
      </form>
    </div>
  );
}
