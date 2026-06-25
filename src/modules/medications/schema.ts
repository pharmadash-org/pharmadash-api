import { z } from 'zod';
import { MedicationCategory } from '@prisma/client';

export const createMedicationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  category: z.nativeEnum(MedicationCategory),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  expiryDate: z
    .string()
    .datetime({ offset: true, message: 'expiryDate must be a valid ISO datetime' })
    .refine((d) => new Date(d) > new Date(), { message: 'expiryDate must be in the future' }),
});

export const updateMedicationSchema = createMedicationSchema.partial();

export const listMedicationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  name: z.string().optional(),
  category: z.nativeEnum(MedicationCategory).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});

export type CreateMedicationDto = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationDto = z.infer<typeof updateMedicationSchema>;
export type ListMedicationsQuery = z.infer<typeof listMedicationsQuerySchema>;
