"use client";

// Google Maps Embed API — mismo proveedor que la ficha pública (PropertyMap).
// Decisión explícita del cliente: preview con el iframe de Google en vez de
// maplibre-gl/MapTiler. Costo: un iframe no puede reportar clicks al padre
// (sandboxing por diseño), así que acá no hay pin arrastrable — el ajuste
// manual se hace con inputs numéricos de lat/lng, siempre visibles como
// alternativa al parseo de URL, no solo como fallback de error.
import { useState, useTransition } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resolveMapsUrl } from "@/app/admin/(dashboard)/propiedades/maps-actions";

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
}

const EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualLat, setManualLat] = useState(value ? String(value.lat) : "");
  const [manualLng, setManualLng] = useState(value ? String(value.lng) : "");
  const [isPending, startTransition] = useTransition();

  function handleResolve() {
    if (!url.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await resolveMapsUrl(url.trim());
      if (result.ok) {
        onChange({ lat: result.lat, lng: result.lng });
        setManualLat(String(result.lat));
        setManualLng(String(result.lng));
      } else {
        setError(result.error);
        setManualOpen(true);
      }
    });
  }

  function applyManual() {
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError("Latitud inválida — debe ser un número entre -90 y 90.");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError("Longitud inválida — debe ser un número entre -180 y 180.");
      return;
    }
    setError(null);
    onChange({ lat, lng });
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Ubicación</label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleResolve();
            }
          }}
          placeholder="Pegá el enlace de Google Maps del lugar..."
          className="flex-1"
        />
        <Button type="button" variant="outline" disabled={isPending || !url.trim()} onClick={handleResolve}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Buscando...
            </>
          ) : (
            "Buscar ubicación"
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Abrí el lugar en Google Maps, tocá &quot;Compartir&quot; y pegá el enlace acá
        (funciona con enlaces cortos maps.app.goo.gl también).
      </p>

      {error && (
        <p role="alert" aria-live="assertive" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {EMBED_KEY && value ? (
        <div className="space-y-1.5">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=${EMBED_KEY}&q=${value.lat},${value.lng}&zoom=15`}
            className="h-56 w-full rounded-[var(--radius)] border border-border"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Previsualización de la ubicación"
          />
          <p className="text-xs text-muted-foreground">
            Pin en {value.lat.toFixed(6)}, {value.lng.toFixed(6)} — si no es exacto,
            corregilo abajo en &quot;Ajustar manualmente&quot;.
          </p>
        </div>
      ) : !EMBED_KEY ? (
        <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-[var(--radius)] border border-dashed border-border bg-brand-neutral p-6 text-center">
          <p className="text-sm font-medium text-foreground">Mapa no configurado</p>
          <p className="text-xs text-muted-foreground">
            Las coordenadas igual se guardan — el preview visual se activa con
            NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY.
          </p>
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-border bg-brand-neutral p-6 text-center">
          <MapPin className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Pegá un enlace de Google Maps o ajustá las coordenadas manualmente.
          </p>
        </div>
      )}

      <div className="rounded-[var(--radius)] border border-border">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-medium text-foreground"
        >
          Ajustar manualmente
          <span className="text-xs text-muted-foreground">{manualOpen ? "Ocultar" : "Mostrar"}</span>
        </button>
        {manualOpen && (
          <div className="flex flex-col gap-2 border-t border-border p-3.5 sm:flex-row">
            <Input
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              type="number"
              step="any"
              placeholder="Latitud"
              className="flex-1"
            />
            <Input
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              type="number"
              step="any"
              placeholder="Longitud"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={applyManual}>
              Aplicar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
