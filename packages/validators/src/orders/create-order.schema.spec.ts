import { describe, it, expect } from 'bun:test';
import { createOrderSchema } from './create-order.schema';

describe('Order Schema (S3)', () => {
    it('should validate correct order data', () => {
        const result = createOrderSchema.safeParse({
            items: [{ productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 }],
            totalAmount: 100
        });
        expect(result.success).toBe(true);
    });

    it('should reject empty items', () => {
        const result = createOrderSchema.safeParse({
            items: [],
            totalAmount: 100
        });
        expect(result.success).toBe(false);
    });
});
