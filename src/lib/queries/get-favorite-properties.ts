import { createClient } from "@/lib/supabase/server";
import type { PropertyListItem } from "@/types/property";

interface FavoritePropertyRow {
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
  property_images: {
    storage_path: string;
    alt_text: string | null;
    is_cover: boolean;
  }[];
}

// No hay RPC para "traeme estas N propiedades por id" — search_properties
// está pensado para filtros, no para una lista arbitraria de ids. Consulta
// directa a la tabla, con el mismo filtro status='publicada' que exige el
// resto del sitio público (si una propiedad favoriteada se archivó después,
// simplemente deja de aparecer acá).
export async function getFavoriteProperties(
  propertyIds: string[],
): Promise<PropertyListItem[]> {
  if (propertyIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `id, slug, operation_type, property_type, title, price_amount,
       price_currency, price_period, bedrooms, bathrooms, parking_spots,
       area_built_m2, city, state_region, view_count, published_at,
       property_images ( storage_path, alt_text, is_cover )`,
    )
    .eq("status", "publicada")
    .in("id", propertyIds);

  if (error || !data) {
    console.error("getFavoriteProperties error:", error?.message);
    return [];
  }

  const rows = data as unknown as FavoritePropertyRow[];

  return rows.map((row) => {
    const images = row.property_images ?? [];
    const cover = images.find((i) => i.is_cover) ?? images[0];

    return {
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
      coverImageUrl: cover?.storage_path ?? null,
      coverImageAlt: cover?.alt_text ?? row.title,
    } satisfies PropertyListItem;
  });
}
