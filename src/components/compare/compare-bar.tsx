"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { useCompare } from "@/lib/compare/compare-context";
import { Button } from "@/components/ui/button";

export function CompareBar() {
  const { ids, clear } = useCompare();

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-brand-accent-dark" />
          <span className="text-sm text-foreground">
            {ids.length} {ids.length === 1 ? "propiedad" : "propiedades"} para comparar
          </span>
          <button
            onClick={clear}
            className="text-xs text-muted-foreground underline hover:text-destructive"
          >
            limpiar
          </button>
        </div>
        <Button asChild size="sm" disabled={ids.length < 2}>
          <Link href="/comparar" aria-disabled={ids.length < 2}>
            Ver comparación
          </Link>
        </Button>
      </div>
    </div>
  );
}
