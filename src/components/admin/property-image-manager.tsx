"use client";

import { useRef, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { Star, Trash2, Upload } from "lucide-react";
import {
  uploadPropertyImages,
  deletePropertyImage,
  setCoverImage,
} from "@/app/admin/(dashboard)/propiedades/actions";

interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  isCover: boolean;
}

export function PropertyImageManager({
  propertyId,
  images,
}: {
  propertyId: string;
  images: PropertyImage[];
}) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));
    startTransition(async () => {
      await uploadPropertyImages(propertyId, formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius)] border border-border bg-brand-neutral"
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="200px"
                className="object-cover"
              />
              {img.isCover && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Portada
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isCover && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(() => setCoverImage(propertyId, img.id))
                    }
                    aria-label="Marcar como portada"
                    className="flex size-8 items-center justify-center rounded-full bg-white text-brand-ink hover:scale-105"
                  >
                    <Star className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (!confirm("¿Eliminar esta imagen?")) return;
                    startTransition(() =>
                      deletePropertyImage(propertyId, img.id),
                    );
                  }}
                  aria-label="Eliminar imagen"
                  className="flex size-8 items-center justify-center rounded-full bg-white text-destructive hover:scale-105"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-border py-4 text-sm text-muted-foreground hover:bg-brand-neutral">
        <Upload className="size-4" />
        {isPending ? "Subiendo..." : "Subir imágenes"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isPending}
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}
