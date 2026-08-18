"use client";

// Coordenadas manuales — la integración con Google Maps que tenía este
// componente (iframe embed, pegar un link para autocompletar, fallback de
// Geocoding API) se eliminó por completo del proyecto. El agente ingresa
// latitud/longitud directo; se pueden sacar de cualquier app de mapas
// manteniendo presionado el punto exacto y copiando los números.
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [lat, setLat] = useState(value ? String(value.lat) : "");
  const [lng, setLng] = useState(value ? String(value.lng) : "");
  const [error, setError] = useState<string | null>(null);

  function commit(nextLat: string, nextLng: string) {
    if (!nextLat.trim() || !nextLng.trim()) return;

    const parsedLat = Number(nextLat);
    const parsedLng = Number(nextLng);

    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setError("Latitud inválida — debe ser un número entre -90 y 90.");
      return;
    }
    if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setError("Longitud inválida — debe ser un número entre -180 y 180.");
      return;
    }
    setError(null);
    onChange({ lat: parsedLat, lng: parsedLng });
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        Ubicación (latitud / longitud)
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={lat}
          onChange={(e) => {
            setLat(e.target.value);
            commit(e.target.value, lng);
          }}
          type="number"
          step="any"
          placeholder="Latitud"
          className="flex-1"
        />
        <Input
          value={lng}
          onChange={(e) => {
            setLng(e.target.value);
            commit(lat, e.target.value);
          }}
          type="number"
          step="any"
          placeholder="Longitud"
          className="flex-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Podés sacar estos números de cualquier app de mapas: mantené
        presionado el punto exacto en el mapa y copiá las coordenadas que
        aparecen.
      </p>
      {error && (
        <p role="alert" aria-live="assertive" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
