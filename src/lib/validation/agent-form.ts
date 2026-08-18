import { z } from "zod";

export const agentFormSchema = z.object({
  name: z
    .string("Escribí el nombre del agente.")
    .min(2, "El nombre es muy corto.")
    .max(120, "El nombre es muy largo."),
  email: z
    .string("Escribí un email.")
    .email("Ese email no parece válido — revisá que esté bien escrito."),
  phone: z.string().max(30, "El teléfono es muy largo.").optional().or(z.literal("")),
  whatsapp: z.string().max(30, "El número es muy largo.").optional().or(z.literal("")),
  agencyId: z.string("Elegí una agencia.").uuid("Elegí una agencia de la lista."),
  isSuperAgent: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;
