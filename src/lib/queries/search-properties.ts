import { createClient } from "@/lib/supabase/server";
import type { PropertyFilters } from "@/lib/validation/property-filters";
import type { PropertyListItem } from "@/types/property";

// Reemplaza los datos mock de FASE 2 — mismo contrato de entrada/salida,
// ahora contra el RPC search_properties (ver migración search_properties_rpc).
const PAGE_SIZE = 4;

interface SearchPropertiesRow {
  id: string;
  slug: string;
  operation_type: PropertyListItem["operationType"];
  property_type: PropertyListItem["propertyType"];
  title: string;
  price_amount: number;
  price_currency: string;
  price_period: PropertyListItem["pricePeriod"];
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  area_built_m2: number;
  city: string;
  state_region: string;
  view_count: number;
  published_at: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  total_count: number;
}

export async function searchProperties(filters: PropertyFilters) {
  const supabase = await createClient();

  // El tipo generado del RPC define estos parámetros como opcionales
  // (?: T, con DEFAULT NULL del lado de Postgres), no como `T | null` — pasar
  // `undefined` en vez de `null` produce exactamente el mismo request (la
  // key se omite del JSON, Postgres aplica su propio default), así que esto
  // no cambia el comportamiento real, solo el tipo con el que se lo describe.
  const { data, error } = await supabase.rpc("search_properties", {
    p_operacion: filters.operacion ?? undefined,
    p_tipo: filters.tipo ?? undefined,
    p_ciudad: filters.ciudad ?? undefined,
    p_precio_min: filters.precioMin ?? undefined,
    p_precio_max: filters.precioMax ?? undefined,
    p_habitaciones: filters.habitaciones ?? undefined,
    p_banos: filters.banos ?? undefined,
    p_estacionamientos: filters.estacionamientos ?? undefined,
    p_comodidades: filters.comodidades,
    p_orden: filters.orden,
    p_pagina: filters.pagina,
    p_page_size: PAGE_SIZE,
  });

  if (error) {
    console.error("searchProperties RPC error:", error.message);
    return { items: [], total: 0, page: 1, totalPages: 1, pageSize: PAGE_SIZE };
  }

  const rows = (data ?? []) as SearchPropertiesRow[];
  const total = rows[0] ? Number(rows[0].total_count) : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const items: PropertyListItem[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    operationType: row.operation_type,
    propertyType: row.property_type,
    title: row.title,
    priceAmount: Number(row.price_amount),
    priceCurrency: row.price_currency,
    pricePeriod: row.price_period,
    bedrooms: row.bedrooms,
    bathrooms: Number(row.bathrooms),
    parkingSpots: row.parking_spots,
    areaBuiltM2: Number(row.area_built_m2),
    city: row.city,
    stateRegion: row.state_region,
    viewCount: row.view_count,
    publishedAt: row.published_at,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt ?? row.title,
  }));

  return {
    items,
    total,
    page: filters.pagina,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
