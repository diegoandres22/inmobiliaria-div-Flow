"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";

// Bottom-sheet — es la respuesta directa a "filtros como formulario largo
// inline" de la referencia. side="bottom" ya es el default del Sheet.
// Mismo criterio que FilterBar: esenciales primero, el resto detrás de
// "Más filtros" para no volcar todo junto ni bien se abre el drawer.
interface FilterDrawerProps {
  categories: AmenityCategory[];
  amenities: Amenity[];
}

export function FilterDrawer({ categories, amenities }: FilterDrawerProps) {
  const { filters, updateFilters, clearFilters } = usePropertyFilters();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="outline" className="w-full">
          <SlidersHorizontal className="size-4" />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtros de búsqueda</SheetTitle>
          <SheetDescription>
            Ajustá y aplicá para ver resultados.
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-6">
          <PropertyFilterFields
            values={filters}
            onChange={updateFilters}
            section="essential"
            className="flex flex-col gap-4"
          />

          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="mas-filtros" className="border-none">
              <AccordionTrigger className="py-2">Más filtros</AccordionTrigger>
              <AccordionContent>
                <PropertyFilterFields
                  values={filters}
                  onChange={updateFilters}
                  section="advanced"
                  className="flex flex-col gap-4"
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
        </div>
        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={clearFilters}>
            Limpiar
          </Button>
          <Button className="flex-1" onClick={() => setOpen(false)}>
            Ver resultados
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
