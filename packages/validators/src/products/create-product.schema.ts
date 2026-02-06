import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().min(3, 'Name too short').max(255),
    price: z.number().positive(),
    sku: z.string().min(3),
    description: z.string().optional(),
    stock: z.number().int().nonnegative().default(0),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
