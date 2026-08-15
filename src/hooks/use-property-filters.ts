"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  propertyFilterSchema,
  type PropertyFilters,
} from "@/lib/validation/property-filters";

// Única puerta de entrada entre la URL y los filtros — nunca se lee
// searchParams "crudo" en ningún componente, siempre pasa por el zod schema.
export function usePropertyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<PropertyFilters>(() => {
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = propertyFilterSchema.safeParse(raw);
    return parsed.success ? parsed.data : propertyFilterSchema.parse({});
  }, [searchParams]);

  const updateFilters = useCallback(
    (patch: Partial<Record<string, string | number | undefined>>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      // cualquier cambio de filtro reinicia la paginación
      if (!("pagina" in patch)) {
        params.delete("pagina");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return { filters, updateFilters, clearFilters };
}
