"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  propertyId: string;
  initialFavorite: boolean;
  className?: string;
}

export function FavoriteButton({
  propertyId,
  initialFavorite,
  className,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle(e: MouseEvent) {
    // Evita navegar cuando el botón vive dentro de un <Link> (PropertyCard).
    e.preventDefault();
    e.stopPropagation();

    const next = !favorited;
    setFavorited(next); // optimista

    startTransition(async () => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      if (!res.ok) setFavorited(!next); // revertir si falló
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-pressed={favorited}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-105 disabled:opacity-60",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4.5 transition-colors",
          favorited ? "fill-destructive text-destructive" : "text-foreground",
        )}
      />
    </button>
  );
}
