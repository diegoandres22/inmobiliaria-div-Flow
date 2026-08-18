import { z } from "zod";

// Mensajes en español, pensados para que los lea un agente inmobiliario sin
// jerga técnica — sin esto, Zod muestra su mensaje default en inglés (ej.
// "Too small: expected string to have >=5 characters"), que es lo que veía
// el agente antes de este cambio en cada campo de este formulario.
export const propertyFormSchema = z.object({
  title: z
    .string("Escribí un título.")
    .min(5, "El título es muy corto — agregá al menos 5 caracteres.")
    .max(150, "El título es muy largo — máximo 150 caracteres."),
  description: z
    .string("Escribí una descripción.")
    .min(20, "La descripción es muy corta — contá un poco más (mínimo 20 caracteres).")
    .max(3000, "La descripción es muy larga — máximo 3000 caracteres."),
  operationType: z.enum(["venta", "alquiler", "alquiler_temporal"], {
    message: "Elegí si es venta, alquiler o alquiler temporal.",
  }),
  propertyType: z.enum(
    ["casa", "apartamento", "local_comercial", "oficina", "terreno", "edificio", "finca"],
    { message: "Elegí el tipo de propiedad." },
  ),
  priceAmount: z.coerce
    .number("Ingresá el precio en números.")
    .positive("El precio tiene que ser mayor a cero."),
  pricePeriod: z
    .enum(["unico", "mensual", ""])
    .optional()
    .transform((v) => (v ? v : undefined)),
  // Opcionales desde el formulario de creación: la sección "Características
  // opcionales" solo agrega estos inputs al DOM si el agente la activa — si
  // no, no llegan en el FormData y el default cubre el NOT NULL de la columna.
  bedrooms: z.coerce
    .number("Ingresá un número de habitaciones.")
    .int("Las habitaciones se cuentan en números enteros, sin decimales.")
    .nonnegative("Las habitaciones no pueden ser un número negativo.")
    .optional()
    .default(0),
  bathrooms: z.coerce
    .number("Ingresá un número de baños.")
    .nonnegative("Los baños no pueden ser un número negativo.")
    .optional()
    .default(0),
  parkingSpots: z.coerce
    .number("Ingresá un número de estacionamientos.")
    .int("Los estacionamientos se cuentan en números enteros, sin decimales.")
    .nonnegative("Los estacionamientos no pueden ser un número negativo.")
    .optional()
    .default(0),
  areaBuiltM2: z.coerce
    .number("Ingresá los metros cuadrados construidos.")
    .positive("Los metros cuadrados construidos tienen que ser mayores a cero."),
  addressLine: z
    .string("Escribí la dirección.")
    .min(5, "La dirección es muy corta — agregá un poco más de detalle.")
    .max(200, "La dirección es muy larga — máximo 200 caracteres."),
  city: z
    .string("Escribí la ciudad.")
    .min(2, "El nombre de la ciudad es muy corto.")
    .max(100, "El nombre de la ciudad es muy largo."),
  stateRegion: z
    .string("Escribí el estado, parroquia o municipio.")
    .min(2, "Ese campo es muy corto.")
    .max(100, "Ese campo es muy largo."),
  lat: z.coerce
    .number("Falta la latitud.")
    .min(-90, "La latitud tiene que estar entre -90 y 90.")
    .max(90, "La latitud tiene que estar entre -90 y 90."),
  lng: z.coerce
    .number("Falta la longitud.")
    .min(-180, "La longitud tiene que estar entre -180 y 180.")
    .max(180, "La longitud tiene que estar entre -180 y 180."),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
