"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [errors, setErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));
    setErrors([]);
    startTransition(async () => {
      const result = await uploadPropertyImages(propertyId, formData);
      setErrors(result.errors);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (result.uploaded > 0) {
        toast.success(
          result.uploaded === 1
            ? "1 imagen subida."
            : `${result.uploaded} imágenes subidas.`,
        );
      }
      if (result.errors.length > 0) {
        toast.error(
          result.errors.length === 1
            ? "1 imagen no se pudo subir — revisá el detalle abajo."
            : `${result.errors.length} imágenes no se pudieron subir — revisá el detalle abajo.`,
        );
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const imageId = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await deletePropertyImage(propertyId, imageId);
        toast.success("Imagen eliminada.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo eliminar la imagen.");
      }
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
                  onClick={() => setDeleteTarget(img.id)}
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
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          disabled={isPending}
          onChange={handleUpload}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG o WEBP — máximo 8 MB por imagen.
      </p>
      {errors.length > 0 && (
        <ul
          role="alert"
          aria-live="assertive"
          className="space-y-1 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive"
        >
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="¿Eliminar esta imagen?"
        description="No se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
