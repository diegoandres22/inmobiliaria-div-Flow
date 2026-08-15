"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface PropertyMapProps {
  lat: number;
  lng: number;
  title: string;
  className?: string;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

// Sin clave configurada, no se intenta renderizar un mapa roto — mismo
// criterio que WhatsAppCTA y el footer de redes: fallback honesto, no un
// componente a medias.
export function PropertyMap({ lat, lng, title, className }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!MAPTILER_KEY || !containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: [lng, lat],
      zoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    // #0F6E56 = --color-brand-accent-dark — hardcodeado porque maplibre no lee CSS vars
    new maplibregl.Marker({ color: "#0F6E56" }).setLngLat([lng, lat]).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  if (!MAPTILER_KEY) {
    return (
      <div className={className}>
        <div className="flex h-full flex-col items-center justify-center gap-1 rounded-[var(--radius)] border border-dashed border-border bg-brand-neutral p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Mapa no configurado
          </p>
          <p className="text-xs text-muted-foreground">
            Ubicación aproximada de &quot;{title}&quot; — se activa con
            NEXT_PUBLIC_MAPTILER_KEY en producción.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      role="application"
      aria-label={`Mapa de ubicación de ${title}`}
    />
  );
}
