"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePropertyFilters } from "@/hooks/use-property-filters";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Más relevantes" },
  { value: "recientes", label: "Más recientes" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
];

export function SortSelect() {
  const { filters, updateFilters } = usePropertyFilters();

  return (
    <Select
      value={filters.orden}
      onValueChange={(v) => updateFilters({ orden: v })}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
