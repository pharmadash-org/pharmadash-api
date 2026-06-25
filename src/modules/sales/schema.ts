import { z } from 'zod';

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        medicationId: z.string().uuid('medicationId must be a valid UUID'),
        quantity: z.number().int().positive('Quantity must be a positive integer'),
      }),
    )
    .min(1, 'Sale must have at least one item'),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema>;
