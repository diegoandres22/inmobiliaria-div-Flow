"use client";

// Antes esto era un <form action={updateProperty}> plano en la página de
// edición, sin JS en cliente: cualquier error de validación server-side no
// tenía dónde mostrarse (terminaba en la pantalla de error genérica de
// Next). Este componente replica el mismo patrón try/catch + fieldErrors que
// ya usa new-property-form.tsx, para que un error se vea siempre en el
// campo correspondiente, nunca como una pantalla rota.
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProperty } from "@/app/admin/(dashboard)/propiedades/actions";
import { propertyFormSchema } from "@/lib/validation/property-form";
import type { Amenity, AmenityCategory } from "@/types/property";

interface EditPropertyFormProps {
  propertyId: string;
  categories: AmenityCategory[];
  amenities: Amenity[];
  selectedAmenityIds: Set<string>;
  initialValues: {
    title: string;
    description: string;
    operationType: string;
    propertyType: string;
    priceAmount: number;
    pricePeriod: string | null;
    bedrooms: number;
    bathrooms: number;
    parkingSpots: number;
    areaBuiltM2: number;
    addressLine: string;
    city: string;
    stateRegion: string;
    lat: number | undefined;
    lng: number | undefined;
  };
}

const SELECT_CLASS =
  "flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground";

type FieldErrors = Partial<Record<string, string>>;

export function EditPropertyForm({
  propertyId,
  categories,
  amenities,
  selectedAmenityIds,
  initialValues,
}: EditPropertyFormProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validateField(name: keyof typeof propertyFormSchema.shape, value: string) {
    const fieldSchema = propertyFormSchema.shape[name];
    const result = fieldSchema.safeParse(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (result.success) delete next[name];
      else next[name] = result.error.issues[0]?.message ?? "Revisá este campo.";
      return next;
    });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries());
    const parsed = propertyFormSchema.safeParse(raw);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError("Revisá los campos marcados en rojo.");
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      try {
        await updateProperty(propertyId, formData);
        toast.success("Cambios guardados.");
        router.push("/admin/propiedades");
        router.refresh();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "No se pudo guardar la propiedad.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Input
          name="title"
          placeholder="Título"
          defaultValue={initialValues.title}
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
          defaultValue={initialValues.description}
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
          <select
            name="operationType"
            required
            defaultValue={initialValues.operationType}
            className={SELECT_CLASS}
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
            defaultValue={initialValues.propertyType}
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
            placeholder="Precio (USD)"
            defaultValue={initialValues.priceAmount}
            required
            aria-invalid={Boolean(fieldErrors.priceAmount)}
            onBlur={(e) => validateField("priceAmount", e.target.value)}
          />
          {fieldErrors.priceAmount && (
            <p className="text-xs text-destructive">{fieldErrors.priceAmount}</p>
          )}
        </div>
        <select name="pricePeriod" defaultValue={initialValues.pricePeriod ?? ""} className={SELECT_CLASS}>
          <option value="">Único (venta)</option>
          <option value="mensual">Mensual (alquiler)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Input name="bedrooms" type="number" placeholder="Habitaciones" defaultValue={initialValues.bedrooms} />
        <Input
          name="bathrooms"
          type="number"
          step="0.5"
          placeholder="Baños"
          defaultValue={initialValues.bathrooms}
        />
        <Input
          name="parkingSpots"
          type="number"
          placeholder="Estac."
          defaultValue={initialValues.parkingSpots}
        />
        <div className="space-y-1.5">
          <Input
            name="areaBuiltM2"
            type="number"
            placeholder="m² construidos"
            defaultValue={initialValues.areaBuiltM2}
            required
            aria-invalid={Boolean(fieldErrors.areaBuiltM2)}
            onBlur={(e) => validateField("areaBuiltM2", e.target.value)}
          />
          {fieldErrors.areaBuiltM2 && (
            <p className="text-xs text-destructive">{fieldErrors.areaBuiltM2}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Input
          name="addressLine"
          placeholder="Dirección"
          defaultValue={initialValues.addressLine}
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
            defaultValue={initialValues.city}
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
            defaultValue={initialValues.stateRegion}
            required
            aria-invalid={Boolean(fieldErrors.stateRegion)}
            onBlur={(e) => validateField("stateRegion", e.target.value)}
          />
          {fieldErrors.stateRegion && (
            <p className="text-xs text-destructive">{fieldErrors.stateRegion}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Input
            name="lat"
            type="number"
            step="any"
            placeholder="Latitud"
            defaultValue={initialValues.lat}
            required
            aria-invalid={Boolean(fieldErrors.lat)}
            onBlur={(e) => validateField("lat", e.target.value)}
          />
          {fieldErrors.lat && <p className="text-xs text-destructive">{fieldErrors.lat}</p>}
        </div>
        <div className="space-y-1.5">
          <Input
            name="lng"
            type="number"
            step="any"
            placeholder="Longitud"
            defaultValue={initialValues.lng}
            required
            aria-invalid={Boolean(fieldErrors.lng)}
            onBlur={(e) => validateField("lng", e.target.value)}
          />
          {fieldErrors.lng && <p className="text-xs text-destructive">{fieldErrors.lng}</p>}
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">Comodidades</p>
        {categories.map((category) => {
          const items = amenities.filter((a) => a.categoryId === category.id);
          if (items.length === 0) return null;
          return (
            <div key={category.id} className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{category.name}</p>
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
                      defaultChecked={selectedAmenityIds.has(amenity.id)}
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

      {submitError && (
        <p role="alert" aria-live="assertive" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Guardando...
          </>
        ) : (
          "Guardar cambios"
        )}
      </Button>
    </form>
  );
}
