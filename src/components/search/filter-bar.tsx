"use client";

import { usePropertyFilters } from "@/hooks/use-property-filters";
import { PropertyFilterFields } from "@/components/search/property-filter-fields";
import { AmenitiesFilter } from "@/components/search/amenities-filter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { Amenity, AmenityCategory } from "@/types/property";

interface FilterBarProps {
  categories: AmenityCategory[];
  amenities: Amenity[];
}

// Solo desktop (hidden md:block) — en mobile esto lo reemplaza FilterDrawer.
// Esenciales (operación/tipo/ciudad/precio) siempre visibles; habitaciones/
// baños/estacionamientos/comodidades quedan colapsados detrás de "Más
// filtros" — ningún filtro se eliminó, solo se reordenó la prioridad visual.
export function FilterBar({ categories, amenities }: FilterBarProps) {
  const { filters, updateFilters, clearFilters } = usePropertyFilters();

  return (
    <div className="hidden rounded-[var(--radius)] border border-border bg-background p-5 shadow-sm md:block">
      <PropertyFilterFields
        values={filters}
        onChange={updateFilters}
        section="essential"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      />

      <Accordion type="single" collapsible className="mt-2">
        <AccordionItem value="mas-filtros" className="border-none">
          <AccordionTrigger className="py-2">Más filtros</AccordionTrigger>
          <AccordionContent>
            <PropertyFilterFields
              values={filters}
              onChange={updateFilters}
              section="advanced"
              className="grid grid-cols-3 gap-3"
            />
            <div className="mt-4 border-t border-border pt-4">
              <AmenitiesFilter
                selected={filters.comodidades}
                onChange={(ids) =>
                  updateFilters({ comodidades: ids.join(",") || undefined })
                }
                categories={categories}
                amenities={amenities}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={clearFilters}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
