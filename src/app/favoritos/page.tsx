import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { getFavoriteIds } from "@/lib/queries/get-favorite-ids";
import { getFavoriteProperties } from "@/lib/queries/get-favorite-properties";
import { clientConfig } from "@/config/client.config";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const favoriteIds = await getFavoriteIds();
  const properties = await getFavoriteProperties([...favoriteIds]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
          Guardados
        </p>
        <h1 className="font-heading text-2xl text-foreground md:text-3xl">
          Tus favoritos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guardados en este navegador — no hace falta cuenta ni login.
        </p>

        {properties.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} isFavorite />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-[var(--radius)] border border-dashed border-border py-20 text-center">
            <Heart className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todavía no guardaste ninguna propiedad.
            </p>
            <Button asChild className="mt-2">
              <Link href="/propiedades">Explorar propiedades</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={clientConfig.contact.whatsapp ?? undefined} />
    </div>
  );
}
