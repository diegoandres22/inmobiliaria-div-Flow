import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProperty } from "../actions";

// <select> nativo a propósito: el form usa action={serverAction} (progressive
// enhancement, funciona sin JS) — el Select de shadcn no es un <select> real
// por debajo y no participa en FormData sin wiring extra de estado.
export default function NewPropertyPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-heading text-xl text-foreground">
        Nueva propiedad
      </h1>
      <form action={createProperty} className="space-y-4">
        <Input name="title" placeholder="Título" required />
        <textarea
          name="description"
          placeholder="Descripción"
          rows={4}
          required
          className="flex w-full rounded-[var(--radius)] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Operación
            </label>
            <select
              name="operationType"
              required
              className="flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground"
            >
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="alquiler_temporal">Alquiler temporal</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Tipo
            </label>
            <select
              name="propertyType"
              required
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

        <div className="grid grid-cols-2 gap-3">
          <Input name="priceAmount" type="number" placeholder="Precio (USD)" required />
          <select
            name="pricePeriod"
            className="flex h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3.5 text-sm text-foreground"
          >
            <option value="">Único (venta)</option>
            <option value="mensual">Mensual (alquiler)</option>
          </select>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Input name="bedrooms" type="number" placeholder="Habitaciones" defaultValue={0} />
          <Input name="bathrooms" type="number" step="0.5" placeholder="Baños" defaultValue={1} />
          <Input name="parkingSpots" type="number" placeholder="Estac." defaultValue={0} />
          <Input name="areaBuiltM2" type="number" placeholder="m² construidos" required />
        </div>

        <Input name="addressLine" placeholder="Dirección" required />
        <div className="grid grid-cols-3 gap-3">
          <Input name="city" placeholder="Ciudad" required />
          <Input name="stateRegion" placeholder="Estado/Región" required />
          <Input name="countryCode" placeholder="País (MX, CO...)" maxLength={2} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input name="lat" type="number" step="any" placeholder="Latitud" required />
          <Input name="lng" type="number" step="any" placeholder="Longitud" required />
        </div>
        <p className="text-xs text-muted-foreground">
          Buscá la dirección en Google Maps, click derecho sobre el punto →
          copiar coordenadas, pegalas acá. Un picker visual sobre el mapa
          queda pendiente.
        </p>

        <Button type="submit" className="w-full">
          Guardar como borrador
        </Button>
      </form>
    </div>
  );
}
