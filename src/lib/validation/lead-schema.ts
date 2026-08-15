import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().max(1000).optional(),
  propertyId: z.string().uuid().optional(),
  source: z.string().max(50).default("web"),
  // Honeypot — invisible para humanos vía CSS; si viene lleno, es un bot.
  website: z.string().max(0).optional().or(z.literal("")),
  // Time-trap — epoch ms de cuándo se montó el form en el cliente.
  formRenderedAt: z.number(),
});

export type LeadInput = z.infer<typeof leadSchema>;
