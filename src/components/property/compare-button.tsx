"use client";

import type { MouseEvent } from "react";
import { Scale } from "lucide-react";
import { useCompare } from "@/lib/compare/compare-context";
import { cn } from "@/lib/utils";

export function CompareButton({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const { isComparing, toggle, isFull } = useCompare();
  const active = isComparing(propertyId);
  const disabled = !active && isFull;

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    toggle(propertyId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={active ? "Quitar del comparador" : "Agregar al comparador"}
      aria-pressed={active}
      title={disabled ? `Máximo ${4} propiedades para comparar` : undefined}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-105 disabled:opacity-40",
        active && "bg-primary text-primary-foreground",
        className,
      )}
    >
      <Scale className="size-4" />
    </button>
  );
}
