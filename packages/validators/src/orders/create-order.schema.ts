import { z } from 'zod';

export const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
    })).min(1, 'Order must have at least one item'),
    totalAmount: z.number().positive(),
    currency: z.string().length(3).default('USD'),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
