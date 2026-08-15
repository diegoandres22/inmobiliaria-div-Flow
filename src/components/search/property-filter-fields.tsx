"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertyFilters } from "@/lib/validation/property-filters";

// Campos base — el bloque de comodidades agrupadas por categoría (con
// buscador interno/colapsables) va en el próximo módulo, es su propia pieza.
const OPERATION_OPTIONS = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
  { value: "alquiler_temporal", label: "Alquiler temporal" },
];

const TYPE_OPTIONS = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "local_comercial", label: "Local comercial" },
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
  { value: "edificio", label: "Edificio" },
  { value: "finca", label: "Finca" },
];

interface PropertyFilterFieldsProps {
  values: Partial<PropertyFilters>;
  onChange: (
    patch: Partial<Record<string, string | number | undefined>>,
  ) => void;
  className?: string;
  /**
   * "essential" = operación/tipo/ciudad/precio (visible por defecto).
   * "advanced" = habitaciones/baños/estacionamientos (detrás de "Más filtros").
   * Ningún campo se elimina, solo se reparte en dos grupos — ver FilterBar/FilterDrawer.
   */
  section?: "essential" | "advanced";
}

export function PropertyFilterFields({
  values,
  onChange,
  className,
  section = "essential",
}: PropertyFilterFieldsProps) {
  if (section === "advanced") {
    return (
      <div className={className}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Habitaciones
          </label>
          <Select
            value={values.habitaciones?.toString() ?? "cualquiera"}
            onValueChange={(v) =>
              onChange({ habitaciones: v === "cualquiera" ? undefined : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cualquiera">Cualquiera</SelectItem>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Baños</label>
          <Select
            value={values.banos?.toString() ?? "cualquiera"}
            onValueChange={(v) =>
              onChange({ banos: v === "cualquiera" ? undefined : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cualquiera">Cualquiera</SelectItem>
              {[1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Estac.
          </label>
          <Select
            value={values.estacionamientos?.toString() ?? "cualquiera"}
            onValueChange={(v) =>
              onChange({
                estacionamientos: v === "cualquiera" ? undefined : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cualquiera">Cualquiera</SelectItem>
              {[1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Operación
        </label>
        <Select
          value={values.operacion ?? "todas"}
          onValueChange={(v) =>
            onChange({ operacion: v === "todas" ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Cualquiera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Cualquiera</SelectItem>
            {OPERATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Tipo de propiedad
        </label>
        <Select
          value={values.tipo ?? "todos"}
          onValueChange={(v) =>
            onChange({ tipo: v === "todos" ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Cualquiera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Cualquiera</SelectItem>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Ciudad</label>
        <Input
          placeholder="Ej. Ciudad de México"
          defaultValue={values.ciudad ?? ""}
          onBlur={(e) => onChange({ ciudad: e.target.value || undefined })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Precio mín. (USD)
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            defaultValue={values.precioMin ?? ""}
            onBlur={(e) =>
              onChange({ precioMin: e.target.value || undefined })
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Precio máx. (USD)
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Sin límite"
            defaultValue={values.precioMax ?? ""}
            onBlur={(e) =>
              onChange({ precioMax: e.target.value || undefined })
            }
          />
        </div>
      </div>
    </div>
  );
}
