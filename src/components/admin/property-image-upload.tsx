"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { Star, Trash2, Upload, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/images/compress-image";

export interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  isCover: boolean;
}

interface PropertyImageUploadProps {
  images: PendingImage[];
  onChange: (images: PendingImage[]) => void;
}

// Mismo límite que el bucket de Storage y validate-image.ts server-side
// (ver actions.ts / migración del bucket property-images) — repetido acá
// porque ese archivo es "server-only" y no se puede importar en cliente.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Buffer client-side de imágenes ANTES de que la propiedad exista — a
// diferencia de PropertyImageManager (edición, sube directo porque ya hay
// propertyId), acá se arma el set completo en memoria y recién se sube
// después de crear la propiedad (ver new-property-form.tsx). Reordenar,
// portada y borrar operan solo sobre este estado en memoria — nada toca
// Storage hasta el submit final.
export function PropertyImageUpload({ images, onChange }: PropertyImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setErrors([]);
    setIsProcessing(true);

    const nextErrors: string[] = [];
    const accepted: PendingImage[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        nextErrors.push(`"${file.name}": solo se aceptan JPEG, PNG o WEBP.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        nextErrors.push(`"${file.name}": supera el máximo de 8 MB.`);
        continue;
      }

      const compressed = await compressImage(file);
      accepted.push({
        id: crypto.randomUUID(),
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
        isCover: false,
      });
    }

    const merged = [...images, ...accepted];
    // La primera imagen que entra (si todavía no había ninguna con portada)
    // queda como portada por defecto — mismo criterio que uploadPropertyImages.
    // noUncheckedIndexedAccess: merged[0] tipa undefined pese al length > 0 de
    // arriba — guard explícito en vez de un non-null assertion.
    const first = merged[0];
    if (first && !merged.some((img) => img.isCover)) {
      merged[0] = { ...first, isCover: true };
    }

    onChange(merged);
    setErrors(nextErrors);
    setIsProcessing(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function removeImage(id: string) {
    const target = images.find((img) => img.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    const remaining = images.filter((img) => img.id !== id);
    const firstRemaining = remaining[0];
    if (firstRemaining && !remaining.some((img) => img.isCover)) {
      remaining[0] = { ...firstRemaining, isCover: true };
    }
    onChange(remaining);
  }

  function setCover(id: string) {
    onChange(images.map((img) => ({ ...img, isCover: img.id === id })));
  }

  function move(id: string, direction: -1 | 1) {
    const index = images.findIndex((img) => img.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= images.length) return;
    const reordered = [...images];
    // noUncheckedIndexedAccess: ambos índices ya están validados arriba
    // (dentro de rango), pero TS no lo infiere en una asignación por
    // destructuring — guard explícito en vez de non-null assertions.
    const a = reordered[index];
    const b = reordered[target];
    if (!a || !b) return;
    reordered[index] = b;
    reordered[target] = a;
    onChange(reordered);
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Fotos</label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius)] border border-border bg-brand-neutral"
            >
              <Image src={img.previewUrl} alt="" fill sizes="200px" className="object-cover" unoptimized />
              {img.isCover && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Portada
                </span>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-2">
                  {!img.isCover && (
                    <button
                      type="button"
                      onClick={() => setCover(img.id)}
                      aria-label="Marcar como portada"
                      className="flex size-8 items-center justify-center rounded-full bg-white text-brand-ink hover:scale-105"
                    >
                      <Star className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    aria-label="Quitar imagen"
                    className="flex size-8 items-center justify-center rounded-full bg-white text-destructive hover:scale-105"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(img.id, -1)}
                    aria-label="Mover antes"
                    className="flex size-8 items-center justify-center rounded-full bg-white text-brand-ink hover:scale-105 disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() => move(img.id, 1)}
                    aria-label="Mover después"
                    className="flex size-8 items-center justify-center rounded-full bg-white text-brand-ink hover:scale-105 disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed py-8 text-sm transition-colors ${
          isDragging
            ? "border-brand-accent bg-brand-neutral"
            : "border-border text-muted-foreground hover:bg-brand-neutral"
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Optimizando imágenes...
          </>
        ) : (
          <>
            <Upload className="size-5" />
            Arrastrá tus fotos acá o hacé click para elegirlas
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG o WEBP — máximo 8 MB por imagen. Se optimizan automáticamente antes de guardar.
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
    </div>
  );
}
