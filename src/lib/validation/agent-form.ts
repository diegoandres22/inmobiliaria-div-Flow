import { z } from "zod";

export const agentFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  agencyId: z.string().uuid(),
  isSuperAgent: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;
