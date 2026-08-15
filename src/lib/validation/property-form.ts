import { z } from "zod";

export const propertyFormSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20).max(3000),
  operationType: z.enum(["venta", "alquiler", "alquiler_temporal"]),
  propertyType: z.enum([
    "casa",
    "apartamento",
    "local_comercial",
    "oficina",
    "terreno",
    "edificio",
    "finca",
  ]),
  priceAmount: z.coerce.number().positive(),
  pricePeriod: z
    .enum(["unico", "mensual", ""])
    .optional()
    .transform((v) => (v ? v : undefined)),
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().nonnegative(),
  parkingSpots: z.coerce.number().int().nonnegative(),
  areaBuiltM2: z.coerce.number().positive(),
  addressLine: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  stateRegion: z.string().min(2).max(100),
  countryCode: z.string().length(2),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
