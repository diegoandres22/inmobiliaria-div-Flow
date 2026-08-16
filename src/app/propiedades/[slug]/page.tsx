import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BedDouble, Bath, Car, Ruler, MapPin } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyMap } from "@/components/property/property-map";
import { PropertyAmenities } from "@/components/property/property-amenities";
import { PropertyContactCard } from "@/components/property/property-contact-card";
import { PropertyLeadForm } from "@/components/property/property-lead-form";
import { FavoriteButton } from "@/components/property/favorite-button";
import { CompareButton } from "@/components/property/compare-button";
import { ShareProperty } from "@/components/property/share-property";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteIds } from "@/lib/queries/get-favorite-ids";
import { clientConfig } from "@/config/client.config";
import type { PropertyDetail } from "@/types/property";

interface PropertyPageProps {
  params: Promise<{ slug: string }>;
}

// Reemplaza los datos mock de FASE 3 — un solo RPC trae ficha + imágenes +
// comodidades + agente (ver migración get_property_by_slug_rpc).
async function getProperty(slug: string): Promise<PropertyDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_property_by_slug", {
    p_slug: slug,
  });

  if (error || !data) return null;
  return data as PropertyDetail;
}

function formatPrice(property: PropertyDetail) {
  const amount = new Intl.NumberFormat("es", {
    style: "currency",
    currency: property.priceCurrency,
    maximumFractionDigits: 0,
  }).format(property.priceAmount);
  return property.pricePeriod === "mensual" ? `${amount}/mes` : amount;
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return {};

  const priceLabel = formatPrice(property);
  const specsLabel = [
    property.bedrooms > 0 ? `${property.bedrooms} hab` : null,
    `${property.bathrooms} baños`,
    `${property.areaBuiltM2} m²`,
  ]
    .filter(Boolean)
    .join(" · ");
  const locationLabel = `${property.city}, ${property.stateRegion}`;
  const url = `${clientConfig.seo.siteUrl}/propiedades/${property.slug}`;
  const coverImage = property.images[0];

  // El <title>/<meta description> del buscador usan la descripción real del
  // listado (SEO). La vista previa social (og:description) antepone precio +
  // ubicación + specs — es lo que decide un click en WhatsApp/Twitter/etc.,
  // no las primeras 155 palabras de la descripción libre del agente.
  const title = `${property.title} — ${priceLabel}`;
  const description = property.description.slice(0, 155);
  const ogDescription = `${priceLabel} · ${locationLabel} · ${specsLabel}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: property.title,
      description: ogDescription,
      url,
      siteName: clientConfig.brand.name,
      type: "website",
      images: coverImage
        ? [{ url: coverImage.url, alt: coverImage.alt || property.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description: ogDescription,
      images: coverImage ? [coverImage.url] : [],
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const [property, favoriteIds] = await Promise.all([
    getProperty(slug),
    getFavoriteIds(),
  ]);

  if (!property) notFound();

  const agent = property.agent;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    datePosted: property.publishedAt,
    url: `${clientConfig.seo.siteUrl}/propiedades/${property.slug}`,
    image: property.images.map((i) => i.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.addressLine,
      addressLocality: property.city,
      addressRegion: property.stateRegion,
      addressCountry: property.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: property.lat,
      longitude: property.lng,
    },
    offers: {
      "@type": "Offer",
      price: property.priceAmount,
      priceCurrency: property.priceCurrency,
      availability: "https://schema.org/InStock",
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.areaBuiltM2,
      unitCode: "MTK",
    },
  };

  return (
    <>
      {/* Auditoría 2026-08-15 (C2): JSON.stringify no escapa "<" — un título o
          descripción con "</script><script>...</script>" rompía el tag y
          ejecutaba JS arbitrario contra cualquier visitante público. Se
          escapa "<" a su forma unicode (<), válida dentro de un string
          JSON y sin efecto en cómo los buscadores leen el JSON-LD. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PropertyGallery images={property.images} title={property.title} />

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div>
              <div className="flex items-start justify-between gap-3">
                <p className="font-heading text-2xl text-foreground md:text-3xl">
                  {formatPrice(property)}
                </p>
                <div className="flex gap-2">
                  <FavoriteButton
                    propertyId={property.id}
                    initialFavorite={favoriteIds.has(property.id)}
                    className="border border-border"
                  />
                  <CompareButton
                    propertyId={property.id}
                    className="border border-border"
                  />
                  <ShareProperty
                    slug={property.slug}
                    title={property.title}
                    priceLabel={formatPrice(property)}
                    city={property.city}
                    stateRegion={property.stateRegion}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    areaBuiltM2={property.areaBuiltM2}
                    className="[&>*]:border [&>*]:border-border"
                  />
                </div>
              </div>
              <h1 className="mt-1 text-lg font-medium text-foreground">
                {property.title}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {property.addressLine}, {property.city}, {property.stateRegion}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 border-y border-border py-4 text-sm text-foreground">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-2">
                  <BedDouble className="size-4 text-muted-foreground" />
                  {property.bedrooms} habitaciones
                </span>
              )}
              <span className="flex items-center gap-2">
                <Bath className="size-4 text-muted-foreground" />
                {property.bathrooms} baños
              </span>
              {property.parkingSpots > 0 && (
                <span className="flex items-center gap-2">
                  <Car className="size-4 text-muted-foreground" />
                  {property.parkingSpots} estacionamientos
                </span>
              )}
              <span className="flex items-center gap-2">
                <Ruler className="size-4 text-muted-foreground" />
                {property.areaBuiltM2} m² construidos
              </span>
            </div>

            <div>
              <h2 className="font-heading text-lg text-foreground">
                Descripción
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {property.description}
              </p>
            </div>

            {property.amenityIds.length > 0 && (
              <div>
                <h2 className="font-heading text-lg text-foreground">
                  Comodidades
                </h2>
                <div className="mt-2">
                  <PropertyAmenities amenityIds={property.amenityIds} />
                </div>
              </div>
            )}

            <div>
              <h2 className="font-heading text-lg text-foreground">
                Ubicación
              </h2>
              <PropertyMap
                lat={property.lat}
                lng={property.lng}
                title={property.title}
                className="mt-2 h-80 w-full"
              />
            </div>
          </div>

          <div className="space-y-6">
            {agent && (
              <PropertyContactCard
                agent={agent}
                propertyTitle={property.title}
              />
            )}
            <div className="rounded-[var(--radius)] border border-border bg-background p-5 shadow-sm">
              <PropertyLeadForm propertyId={property.id} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={agent?.whatsapp ?? undefined} />
    </>
  );
}
