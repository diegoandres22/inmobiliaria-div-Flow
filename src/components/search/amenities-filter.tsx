"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { Amenity, AmenityCategory } from "@/types/property";
import { cn } from "@/lib/utils";

interface AmenitiesFilterProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  categories: AmenityCategory[];
  amenities: Amenity[];
}

// Agrupadas por categoría, con buscador interno y colapsables — es
// exactamente lo que la referencia no tiene (listado plano de 25+ sin
// agrupar ni buscador). Checkbox nativo + accent-color en vez de un
// primitivo Radix Checkbox propio — no lo justifica el alcance acá.
// Recibe el catálogo real como prop (fetched server-side, ver
// src/lib/queries/get-amenities.ts) en vez de importar datos hardcodeados.
export function AmenitiesFilter({
  selected,
  onChange,
  categories: amenityCategories,
  amenities,
}: AmenitiesFilterProps) {
  const [query, setQuery] = useState("");

  const filteredByCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return amenityCategories.map((category) => ({
      category,
      items: amenities.filter(
        (a) =>
          a.categoryId === category.id &&
          (q === "" || a.name.toLowerCase().includes(q)),
      ),
    }));
  }, [query]);

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Comodidades</p>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar comodidad..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const amenity = amenities.find((a) => a.id === id);
            if (!amenity) return null;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggle(id)}
              >
                {amenity.name} ×
              </Badge>
            );
          })}
        </div>
      )}

      <Accordion
        type="multiple"
        defaultValue={amenityCategories.map((c) => c.id)}
      >
        {filteredByCategory.map(({ category, items }) => {
          if (items.length === 0) return null;
          return (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  {category.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    {items.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {items.map((amenity) => (
                    <label
                      key={amenity.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-border px-3 py-2.5 text-sm",
                        selected.includes(amenity.id)
                          ? "border-brand-accent bg-brand-neutral"
                          : "hover:bg-brand-neutral",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(amenity.id)}
                        onChange={() => toggle(amenity.id)}
                        className="size-4 accent-brand-accent"
                      />
                      {amenity.name}
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
