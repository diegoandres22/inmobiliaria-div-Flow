"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/images/compress-image";
import { uploadAvatar, removeAvatar } from "@/app/admin/(dashboard)/mi-cuenta/actions";

// 512px alcanza de sobra para un avatar circular — mucho menos que el 2000px
// default de compressImage (pensado para galería de propiedades a pantalla completa).
const AVATAR_MAX_DIMENSION = 512;

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function AvatarUpload({
  name,
  initialUrl,
}: {
  name: string;
  initialUrl: string | null;
}) {
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    startTransition(async () => {
      const compressed = await compressImage(file, AVATAR_MAX_DIMENSION);
      const objectUrl = URL.createObjectURL(compressed);
      const previous = previewUrl;
      setPreviewUrl(objectUrl);

      const formData = new FormData();
      formData.append("avatar", compressed);
      const result = await uploadAvatar(formData);
      URL.revokeObjectURL(objectUrl);

      if (result.error) {
        toast.error(result.error);
        setPreviewUrl(previous);
      } else {
        toast.success("Foto de perfil actualizada.");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setPreviewUrl(null);
      toast.success("Foto de perfil eliminada.");
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        aria-label="Cambiar foto de perfil"
        className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-brand-neutral font-heading text-lg text-brand-ink"
      >
        {previewUrl ? (
          <Image src={previewUrl} alt="" fill sizes="80px" className="object-cover" unoptimized />
        ) : (
          initials(name)
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isPending ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <Camera className="size-5 text-white" />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={isPending}
        onChange={handleChange}
      />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Foto de perfil</p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG o WEBP — se ajusta automáticamente. Click en la foto para cambiarla.
        </p>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
          >
            <Trash2 className="size-3" />
            Quitar foto
          </button>
        )}
      </div>
    </div>
  );
}
