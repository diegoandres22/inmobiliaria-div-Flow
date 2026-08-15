import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Amenity, AmenityCategory } from "@/types/property";

// Reemplaza src/lib/mock/amenities.ts — antes el filtro y la ficha de
// propiedad usaban una lista hardcodeada que coincidía por casualidad con
// los IDs sembrados en Supabase; si alguien edita/agrega una comodidad desde
// la base, la UI mockeada queda desincronizada sin avisar. `cache()` evita
// pedir esto dos veces en el mismo request (listado + filtro comparten página).
export const getAmenities = cache(async (): Promise<{
  categories: AmenityCategory[];
  amenities: Amenity[];
}> => {
  const supabase = await createClient();

  const [{ data: categories }, { data: amenities }] = await Promise.all([
    supabase
      .from("amenity_categories")
      .select("id, name, sort_order")
      .order("sort_order"),
    supabase
      .from("amenities")
      .select("id, category_id, name, icon_key")
      .order("name"),
  ]);

  return {
    categories: (categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order,
    })),
    amenities: (amenities ?? []).map((a) => ({
      id: a.id,
      categoryId: a.category_id,
      name: a.name,
      iconKey: a.icon_key,
    })),
  };
});
