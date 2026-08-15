"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePropertyFilters } from "@/hooks/use-property-filters";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const { updateFilters } = usePropertyFilters();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => updateFilters({ pagina: page - 1 })}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="px-3 text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => updateFilters({ pagina: page + 1 })}
        aria-label="Página siguiente"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
