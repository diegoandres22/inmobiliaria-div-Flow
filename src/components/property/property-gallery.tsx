"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PropertyImage } from "@/types/property";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return <div className="aspect-video rounded-[var(--radius)] bg-brand-neutral" />;
  }

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const current = sorted[active];

  function next() {
    setActive((i) => (i + 1) % sorted.length);
  }
  function prev() {
    setActive((i) => (i - 1 + sorted.length) % sorted.length);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative block aspect-video w-full overflow-hidden rounded-[var(--radius)] bg-brand-neutral"
        aria-label="Ampliar imagen"
      >
        {current && (
          <Image
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover"
          />
        )}
      </button>

      {sorted.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {sorted.slice(0, 5).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-[calc(var(--radius)-4px)] ring-2 ring-transparent",
                i === active && "ring-brand-accent",
              )}
              aria-label={`Ver foto ${i + 1} de ${sorted.length}`}
            >
              <Image src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${title}`}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-brand-paper/10 text-brand-paper hover:bg-brand-paper/20"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 flex size-11 items-center justify-center rounded-full bg-brand-paper/10 text-brand-paper hover:bg-brand-paper/20"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="relative h-[80vh] w-full max-w-4xl">
            <Image src={current.url} alt={current.alt} fill sizes="90vw" className="object-contain" />
          </div>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 flex size-11 items-center justify-center rounded-full bg-brand-paper/10 text-brand-paper hover:bg-brand-paper/20"
            aria-label="Foto siguiente"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
