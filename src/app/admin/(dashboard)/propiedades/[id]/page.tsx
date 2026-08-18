import { notFound } from "next/navigation";
import { PropertyImageManager } from "@/components/admin/property-image-manager";
import { EditPropertyForm } from "@/components/admin/edit-property-form";
import { createClient } from "@/lib/supabase/server";
import { getAmenities } from "@/lib/queries/get-amenities";

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
        "id, title, description, operation_type, property_type, price_amount, price_period, bedrooms, bathrooms, parking_spots, area_built_m2, address_line, city, state_region",
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

      <EditPropertyForm
        propertyId={id}
        categories={categories}
        amenities={amenities}
        selectedAmenityIds={selectedIds}
        initialValues={{
          title: property.title,
          description: property.description,
          operationType: property.operation_type,
          propertyType: property.property_type,
          priceAmount: property.price_amount,
          pricePeriod: property.price_period,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          parkingSpots: property.parking_spots,
          areaBuiltM2: property.area_built_m2,
          addressLine: property.address_line,
          city: property.city,
          stateRegion: property.state_region,
          lat: coordinates?.lat,
          lng: coordinates?.lng,
        }}
      />
    </div>
  );
}
