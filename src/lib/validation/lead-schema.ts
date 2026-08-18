import { z } from "zod";

export const leadSchema = z.object({
  name: z
    .string("Escribí tu nombre.")
    .min(2, "El nombre es muy corto.")
    .max(100, "El nombre es muy largo."),
  email: z
    .string("Escribí tu email.")
    .email("Ese email no parece válido — revisá que esté bien escrito."),
  phone: z.string().max(30, "El teléfono es muy largo.").optional(),
  message: z.string().max(1000, "El mensaje es muy largo — máximo 1000 caracteres.").optional(),
  propertyId: z.string().uuid().optional(),
  source: z.string().max(50).default("web"),
  // Honeypot — invisible para humanos vía CSS; si viene lleno, es un bot.
  website: z.string().max(0).optional().or(z.literal("")),
  // Time-trap — epoch ms de cuándo se montó el form en el cliente.
  formRenderedAt: z.number(),
});

export type LeadInput = z.infer<typeof leadSchema>;
