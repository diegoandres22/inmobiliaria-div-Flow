import { getAmenities } from "@/lib/queries/get-amenities";
import { NewPropertyForm } from "@/components/admin/new-property-form";

// Antes esto era un <form action={createProperty}> sin JS: sin fotos, sin
// mapa, lat/lng a mano, comodidades ni siquiera existían acá. Ahora es un
// Server Component liviano (solo trae el catálogo de comodidades) que le
// pasa los datos a NewPropertyForm — toda la interactividad (imágenes,
// picker de ubicación, campos condicionales por tipo) vive ahí porque
// necesita estado de cliente.
export default async function NewPropertyPage() {
  const { categories, amenities } = await getAmenities();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-heading text-xl text-foreground">
        Nueva propiedad
      </h1>
      <NewPropertyForm categories={categories} amenities={amenities} />
    </div>
  );
}
