import { z } from "zod";

// El slug no es un campo de formulario a propósito: se autogenera en el
// server action (mismo patrón que las propiedades, ver
// admin/propiedades/actions.ts) para que nunca choque con el unique
// constraint de la base ni dependa de que el usuario tipee algo válido.
export const agencyFormSchema = z.object({
  name: z
    .string("Escribí el nombre de la agencia.")
    .min(2, "El nombre es muy corto.")
    .max(120, "El nombre es muy largo."),
});

export type AgencyFormValues = z.infer<typeof agencyFormSchema>;
