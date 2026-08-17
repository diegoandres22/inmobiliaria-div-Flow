import { z } from "zod";

// El slug no es un campo de formulario a propósito: se autogenera en el
// server action (mismo patrón que las propiedades, ver
// admin/propiedades/actions.ts) para que nunca choque con el unique
// constraint de la base ni dependa de que el usuario tipee algo válido.
export const agencyFormSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(120),
});

export type AgencyFormValues = z.infer<typeof agencyFormSchema>;
