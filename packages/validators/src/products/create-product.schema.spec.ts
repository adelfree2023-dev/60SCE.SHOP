import { describe, it, expect } from 'bun:test';
import { createProductSchema } from './create-product.schema';

describe('Product Schema (S3)', () => {
    it('should validate correct product data', () => {
        const result = createProductSchema.safeParse({
            name: 'Gaming Mouse',
            price: 59.99,
            sku: 'GM-001',
            stock: 10
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid price', () => {
        const result = createProductSchema.safeParse({
            name: 'Mouse',
            price: -10,
            sku: 'M-1'
        });
        expect(result.success).toBe(false);
    });
});
