import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { LogoMark } from "@/components/layout/logo";
import { HeroSearch } from "@/components/search/hero-search";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { propertyFilterSchema } from "@/lib/validation/property-filters";
import { searchProperties } from "@/lib/queries/search-properties";
import { getFavoriteIds } from "@/lib/queries/get-favorite-ids";
import { clientConfig } from "@/config/client.config";

// Home real — reemplaza la página de verificación visual de FASE 1.
export default async function HomePage() {
  const featuredFilters = propertyFilterSchema.parse({ orden: "relevancia" });
  const [{ items: featured }, favoriteIds] = await Promise.all([
    searchProperties(featuredFilters),
    getFavoriteIds(),
  ]);

  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-brand-ink">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(93,202,165,0.25),transparent_55%)]"
          />
          {/* Motivo de marca de fondo — la propia marca gráfica, no un blob
              genérico. Grande, tenue, flotando muy lento: refuerza identidad
              sin competir con el buscador. */}
          <LogoMark className="pointer-events-none absolute -right-16 top-1/2 hidden h-[140%] w-auto -translate-y-1/2 text-brand-accent/[0.07] motion-safe:animate-float-slow md:block" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:px-6 md:py-24">
            <div className="max-w-2xl space-y-4 motion-safe:animate-fade-up">
              <p className="text-xs font-medium tracking-[0.2em] text-brand-accent uppercase">
                {clientConfig.brand.name}
              </p>
              <h1 className="font-heading text-3xl leading-tight text-brand-paper md:text-5xl">
                {clientConfig.copy.heroTitle}
              </h1>
              <p className="text-base text-brand-paper/75 md:text-lg">
                {clientConfig.copy.heroSubtitle}
              </p>
            </div>
            <div
              className="motion-safe:animate-fade-up"
              style={{ animationDelay: "120ms" }}
            >
              <HeroSearch />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
                Selección
              </p>
              <h2 className="font-heading text-xl text-foreground md:text-2xl">
                Propiedades destacadas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lo más relevante ahora mismo en toda la red.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <Link href="/propiedades">Ver todas</Link>
            </Button>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorite={favoriteIds.has(property.id)}
                  priority={index === 0}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-[var(--radius)] border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Todavía no hay propiedades publicadas.
            </p>
          )}

          <Button variant="outline" asChild className="mt-6 w-full sm:hidden">
            <Link href="/propiedades">Ver todas las propiedades</Link>
          </Button>
        </section>

        {clientConfig.copy.aboutBody && (
          <section className="border-t border-border bg-brand-neutral">
            <div className="mx-auto max-w-3xl px-4 py-14 text-center md:px-6">
              <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
                Quiénes somos
              </p>
              <h2 className="font-heading text-xl text-foreground md:text-2xl">
                {clientConfig.copy.aboutTitle}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                {clientConfig.copy.aboutBody}
              </p>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={clientConfig.contact.whatsapp ?? undefined} />
    </>
  );
}
