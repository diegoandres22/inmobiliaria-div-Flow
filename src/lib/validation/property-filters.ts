import { z } from "zod";

// Contrato único entre la URL de búsqueda y el server component que arma el
// listado — nunca se confía en query params sin pasar por acá primero.
export const propertyFilterSchema = z
  .object({
    operacion: z.enum(["venta", "alquiler", "alquiler_temporal"]).optional(),
    tipo: z
      .enum([
        "casa",
        "apartamento",
        "local_comercial",
        "oficina",
        "terreno",
        "edificio",
        "finca",
      ])
      .optional(),
    ciudad: z.string().min(1, "Escribí una ciudad.").max(80, "Ese nombre de ciudad es muy largo.").optional(),
    precioMin: z.coerce.number().nonnegative().optional(),
    precioMax: z.coerce.number().nonnegative().optional(),
    habitaciones: z.coerce.number().int().nonnegative().optional(),
    banos: z.coerce.number().nonnegative().optional(),
    estacionamientos: z.coerce.number().int().nonnegative().optional(),
    comodidades: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(",").filter(Boolean) : [])),
    orden: z
      .enum(["relevancia", "precio_asc", "precio_desc", "recientes"])
      .default("relevancia"),
    pagina: z.coerce.number().int().positive().default(1),
  })
  .refine(
    (data) =>
      !data.precioMin || !data.precioMax || data.precioMin <= data.precioMax,
    {
      message: "El precio mínimo no puede ser mayor al máximo",
      path: ["precioMin"],
    },
  );

export type PropertyFilters = z.infer<typeof propertyFilterSchema>;
