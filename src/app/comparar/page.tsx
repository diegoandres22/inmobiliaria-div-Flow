"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Scale } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/lib/compare/compare-context";
import { createClient } from "@/lib/supabase/client";

const OPERATION_LABEL: Record<string, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};
const TYPE_LABEL: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  local_comercial: "Local comercial",
  oficina: "Oficina",
  terreno: "Terreno",
  edificio: "Edificio",
  finca: "Finca",
};

interface CompareProperty {
  id: string;
  slug: string;
  title: string;
  operationType: string;
  propertyType: string;
  priceAmount: number;
  priceCurrency: string;
  pricePeriod: string | null;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  areaBuiltM2: number;
  areaLandM2: number | null;
  city: string;
  stateRegion: string;
  coverImageUrl: string | null;
  amenityNames: string[];
}

function formatPrice(p: CompareProperty) {
  const amount = new Intl.NumberFormat("es", {
    style: "currency",
    currency: p.priceCurrency,
    maximumFractionDigits: 0,
  }).format(p.priceAmount);
  return p.pricePeriod === "mensual" ? `${amount}/mes` : amount;
}

const ROWS: { label: string; render: (p: CompareProperty) => ReactNode }[] = [
  { label: "Precio", render: (p) => formatPrice(p) },
  { label: "Operación", render: (p) => OPERATION_LABEL[p.operationType] ?? p.operationType },
  { label: "Tipo", render: (p) => TYPE_LABEL[p.propertyType] ?? p.propertyType },
  { label: "Ubicación", render: (p) => `${p.city}, ${p.stateRegion}` },
  { label: "Habitaciones", render: (p) => (p.bedrooms > 0 ? p.bedrooms : "—") },
  { label: "Baños", render: (p) => p.bathrooms },
  { label: "Estacionamientos", render: (p) => (p.parkingSpots > 0 ? p.parkingSpots : "—") },
  { label: "m² construidos", render: (p) => p.areaBuiltM2 },
  { label: "m² de terreno", render: (p) => p.areaLandM2 ?? "—" },
  {
    label: "Comodidades",
    render: (p) =>
      p.amenityNames.length > 0 ? p.amenityNames.join(", ") : "—",
  },
];

export default function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const showEmpty = ids.length === 0;

  useEffect(() => {
    // Nada que buscar — showEmpty ya cubre este caso en el render de abajo,
    // no hace falta resetear `properties`/`loading` acá (evita el
    // "cascading render" real que sí marcaba la regla react-hooks/set-state-in-effect,
    // a diferencia de los otros usos de este hook en el proyecto que son
    // falsos positivos de hidratación).
    if (ids.length === 0) return;
    const supabase = createClient();

    (async () => {
      // Movido acá adentro (en vez de directo en el body del efecto) por
      // react-hooks/set-state-in-effect — mismo momento de ejecución (corre
      // sincrónico hasta el primer await), solo que en un scope que el
      // linter no marca como "setState directo en un efecto".
      setLoading(true);
      const { data } = await supabase
        .from("properties")
        .select(
          `id, slug, title, operation_type, property_type, price_amount,
           price_currency, price_period, bedrooms, bathrooms, parking_spots,
           area_built_m2, area_land_m2, city, state_region,
           property_images ( storage_path, is_cover ),
           property_amenities ( amenity_id )`,
        )
        .eq("status", "publicada")
        .in("id", ids);

      const amenityIds = new Set<string>();
      for (const row of data ?? []) {
        for (const pa of (row.property_amenities ?? []) as { amenity_id: string }[]) {
          amenityIds.add(pa.amenity_id);
        }
      }

      const { data: amenities } = amenityIds.size
        ? await supabase.from("amenities").select("id, name").in("id", [...amenityIds])
        : { data: [] as { id: string; name: string }[] };
      const amenityNameById = new Map((amenities ?? []).map((a) => [a.id, a.name]));

      const mapped: CompareProperty[] = (data ?? []).map((row) => {
        const images = (row.property_images ?? []) as { storage_path: string; is_cover: boolean }[];
        const cover = images.find((i) => i.is_cover) ?? images[0];
        const rowAmenities = (row.property_amenities ?? []) as { amenity_id: string }[];
        return {
          id: row.id,
          slug: row.slug,
          title: row.title,
          operationType: row.operation_type,
          propertyType: row.property_type,
          priceAmount: Number(row.price_amount),
          priceCurrency: row.price_currency,
          pricePeriod: row.price_period,
          bedrooms: row.bedrooms,
          bathrooms: Number(row.bathrooms),
          parkingSpots: row.parking_spots,
          areaBuiltM2: Number(row.area_built_m2),
          areaLandM2: row.area_land_m2 ? Number(row.area_land_m2) : null,
          city: row.city,
          stateRegion: row.state_region,
          coverImageUrl: cover?.storage_path ?? null,
          amenityNames: rowAmenities
            .map((a) => amenityNameById.get(a.amenity_id))
            .filter((n): n is string => Boolean(n)),
        };
      });

      // preservar el orden en que se fueron agregando
      mapped.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      setProperties(mapped);
      setLoading(false);
    })();
  }, [ids]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 pb-24 md:px-6 md:py-14">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl text-foreground md:text-3xl">
              Comparar propiedades
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hasta 4 lado a lado. Se guarda en este navegador.
            </p>
          </div>
          {!showEmpty && (
            <Button variant="outline" onClick={clear}>
              Vaciar
            </Button>
          )}
        </div>

        {showEmpty ? (
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-dashed border-border py-20 text-center">
            <Scale className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todavía no elegiste propiedades para comparar.
            </p>
            <Button asChild className="mt-2">
              <Link href="/propiedades">Explorar propiedades</Link>
            </Button>
          </div>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-40" />
                  {properties.map((p) => (
                    <th key={p.id} className="p-2 text-left align-top">
                      <div className="relative w-full overflow-hidden rounded-[var(--radius)]">
                        <button
                          onClick={() => remove(p.id)}
                          aria-label="Quitar"
                          className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-background/90 shadow-sm"
                        >
                          <X className="size-3.5" />
                        </button>
                        <Link href={`/propiedades/${p.slug}`}>
                          <div className="relative aspect-[4/3] bg-brand-neutral">
                            {p.coverImageUrl && (
                              <Image
                                src={p.coverImageUrl}
                                alt={p.title}
                                fill
                                sizes="220px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
                            {p.title}
                          </p>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="py-3 pr-4 text-sm font-medium text-muted-foreground">
                      {row.label}
                    </td>
                    {properties.map((p) => (
                      <td key={p.id} className="py-3 pr-4 text-sm text-foreground">
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
