import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { FilterBar } from "@/components/search/filter-bar";
import { FilterDrawer } from "@/components/search/filter-drawer";
import { SortSelect } from "@/components/search/sort-select";
import { Pagination } from "@/components/search/pagination";
import { PropertyCard } from "@/components/property/property-card";
import { propertyFilterSchema } from "@/lib/validation/property-filters";
import { searchProperties } from "@/lib/queries/search-properties";
import { getAmenities } from "@/lib/queries/get-amenities";
import { getFavoriteIds } from "@/lib/queries/get-favorite-ids";
import { clientConfig } from "@/config/client.config";

interface PropertiesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const raw = await searchParams;
  const parsed = propertyFilterSchema.safeParse(raw);
  const filters = parsed.success
    ? parsed.data
    : propertyFilterSchema.parse({});

  const [{ items, total, page, totalPages }, { categories, amenities }, favoriteIds] =
    await Promise.all([
      searchProperties(filters),
      getAmenities(),
      getFavoriteIds(),
    ]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Suspense fallback={null}>
          <div className="mb-4 md:hidden">
            <FilterDrawer categories={categories} amenities={amenities} />
          </div>
          <div className="mb-6">
            <FilterBar categories={categories} amenities={amenities} />
          </div>
        </Suspense>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total}{" "}
            {total === 1 ? "propiedad encontrada" : "propiedades encontradas"}
          </p>
          <Suspense fallback={null}>
            <SortSelect />
          </Suspense>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorite={favoriteIds.has(property.id)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius)] border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No encontramos propiedades con esos filtros. Probá ajustarlos.
          </p>
        )}

        <Suspense fallback={null}>
          <Pagination page={page} totalPages={totalPages} />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={clientConfig.contact.whatsapp ?? undefined} />
    </>
  );
}
