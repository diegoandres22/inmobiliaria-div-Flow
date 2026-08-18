"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AmenitiesFilter } from "@/components/search/amenities-filter";
import { LocationPicker } from "@/components/admin/location-picker";
import { PropertyImageUpload, type PendingImage } from "@/components/admin/property-image-upload";
import { createProperty, uploadPropertyImages } from "@/app/admin/(dashboard)/propiedades/actions";
import { propertyFormSchema } from "@/lib/validation/property-form";
import type { Amenity, AmenityCategory } from "@/types/property";

interface NewPropertyFormProps {
  categories: AmenityCategory[];
  amenities: Amenity[];
}

const SELECT_CLASS =
  "flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground";

// Terreno/Local: "habitaciones" y "baños" no aplican conceptualmente — se
// ocultan de la sección opcional. Estacionamientos y comodidades siguen
// siendo relevantes para cualquier tipo, así que quedan siempre.
const HIDES_ROOM_FIELDS = new Set(["terreno", "local_comercial"]);

type FieldErrors = Partial<Record<string, string>>;

export function NewPropertyForm({ categories, amenities }: NewPropertyFormProps) {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState("casa");
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hideRoomFields = HIDES_ROOM_FIELDS.has(propertyType);

  function validateField(name: keyof typeof propertyFormSchema.shape, value: string) {
    const fieldSchema = propertyFormSchema.shape[name];
    const result = fieldSchema.safeParse(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (result.success) delete next[name];
      else next[name] = result.error.issues[0]?.message ?? "Valor inválido";
      return next;
    });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const formData = new FormData(e.currentTarget);
    // lat/lng y amenities no vienen de inputs con `name=` — salen de estado
    // React (LocationPicker / AmenitiesFilter), se agregan a mano acá.
    if (location) {
      formData.set("lat", String(location.lat));
      formData.set("lng", String(location.lng));
    }
    selectedAmenities.forEach((id) => formData.append("amenities", id));

    const raw = Object.fromEntries(formData.entries());
    const parsed = propertyFormSchema.safeParse(raw);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError(
        !location
          ? "Falta la ubicación — ingresá latitud y longitud."
          : "Revisá los campos marcados en rojo.",
      );
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      try {
        const { id } = await createProperty(formData);

        if (images.length > 0) {
          setUploadNote("Subiendo fotos...");
          const uploadData = new FormData();
          images.forEach((img) => uploadData.append("images", img.file));
          const coverIndex = images.findIndex((img) => img.isCover);
          if (coverIndex >= 0) uploadData.set("coverIndex", String(coverIndex));

          const result = await uploadPropertyImages(id, uploadData);
          if (result.errors.length > 0) {
            // La propiedad ya se creó — no perdemos ese trabajo por un error
            // de imágenes. Se avisa y se manda igual a la ficha, donde
            // PropertyImageManager permite reintentar la carga.
            setUploadNote(null);
            router.push(
              `/admin/propiedades/${id}?created=1&imageErrors=${encodeURIComponent(
                result.errors.join(" | "),
              )}`,
            );
            router.refresh();
            return;
          }
        }

        router.push(`/admin/propiedades/${id}?created=1`);
        router.refresh();
      } catch (err) {
        setUploadNote(null);
        setSubmitError(err instanceof Error ? err.message : "No se pudo guardar la propiedad.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <PropertyImageUpload images={images} onChange={setImages} />

      <div className="space-y-4 border-t border-border pt-6">
        <h2 className="font-heading text-base text-foreground">Datos esenciales</h2>

        <div className="space-y-1.5">
          <Input
            name="title"
            placeholder="Título"
            required
            aria-invalid={Boolean(fieldErrors.title)}
            onBlur={(e) => validateField("title", e.target.value)}
          />
          {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <textarea
            name="description"
            placeholder="Descripción"
            rows={4}
            required
            aria-invalid={Boolean(fieldErrors.description)}
            onBlur={(e) => validateField("description", e.target.value)}
            className="flex w-full rounded-[var(--radius)] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive"
          />
          {fieldErrors.description && (
            <p className="text-xs text-destructive">{fieldErrors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Operación</label>
            <select name="operationType" required defaultValue="venta" className={SELECT_CLASS}>
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
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className={SELECT_CLASS}
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
          <div className="space-y-1.5">
            <Input
              name="priceAmount"
              type="number"
              min="0"
              step="any"
              placeholder="Precio (USD)"
              required
              aria-invalid={Boolean(fieldErrors.priceAmount)}
              onBlur={(e) => validateField("priceAmount", e.target.value)}
            />
            {fieldErrors.priceAmount && (
              <p className="text-xs text-destructive">{fieldErrors.priceAmount}</p>
            )}
          </div>
          <select name="pricePeriod" defaultValue="" className={SELECT_CLASS}>
            <option value="">Único (venta)</option>
            <option value="mensual">Mensual (alquiler)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Input
            name="areaBuiltM2"
            type="number"
            min="0"
            step="any"
            placeholder="m² construidos"
            required
            aria-invalid={Boolean(fieldErrors.areaBuiltM2)}
            onBlur={(e) => validateField("areaBuiltM2", e.target.value)}
          />
          {fieldErrors.areaBuiltM2 && (
            <p className="text-xs text-destructive">{fieldErrors.areaBuiltM2}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Input
            name="addressLine"
            placeholder="Dirección"
            required
            aria-invalid={Boolean(fieldErrors.addressLine)}
            onBlur={(e) => validateField("addressLine", e.target.value)}
          />
          {fieldErrors.addressLine && (
            <p className="text-xs text-destructive">{fieldErrors.addressLine}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Input
              name="city"
              placeholder="Ciudad"
              required
              aria-invalid={Boolean(fieldErrors.city)}
              onBlur={(e) => validateField("city", e.target.value)}
            />
            {fieldErrors.city && <p className="text-xs text-destructive">{fieldErrors.city}</p>}
          </div>
          <div className="space-y-1.5">
            <Input
              name="stateRegion"
              placeholder="Parroquia/Municipio"
              required
              aria-invalid={Boolean(fieldErrors.stateRegion)}
              onBlur={(e) => validateField("stateRegion", e.target.value)}
            />
            {fieldErrors.stateRegion && (
              <p className="text-xs text-destructive">{fieldErrors.stateRegion}</p>
            )}
          </div>
        </div>

        <LocationPicker value={location} onChange={setLocation} />
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={optionalOpen}
            onChange={(e) => setOptionalOpen(e.target.checked)}
            className="size-4 accent-brand-accent"
          />
          Agregar características opcionales (habitaciones, baños, estacionamiento, comodidades)
        </label>

        {optionalOpen && (
          <div className="space-y-4 rounded-[var(--radius)] border border-border bg-brand-neutral p-4">
            {!hideRoomFields && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Input name="bedrooms" type="number" min="0" placeholder="Habitaciones" defaultValue={0} />
                <Input name="bathrooms" type="number" min="0" step="0.5" placeholder="Baños" defaultValue={1} />
                <Input name="parkingSpots" type="number" min="0" placeholder="Estac." defaultValue={0} />
              </div>
            )}
            {hideRoomFields && (
              <Input name="parkingSpots" type="number" min="0" placeholder="Estacionamientos" defaultValue={0} />
            )}

            <AmenitiesFilter
              selected={selectedAmenities}
              onChange={setSelectedAmenities}
              categories={categories}
              amenities={amenities}
            />
          </div>
        )}
      </div>

      {submitError && (
        <p role="alert" aria-live="assertive" className="text-sm text-destructive">
          {submitError}
        </p>
      )}
      {uploadNote && (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {uploadNote}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Guardando...
          </>
        ) : (
          "Guardar como borrador"
        )}
      </Button>
    </form>
  );
}
