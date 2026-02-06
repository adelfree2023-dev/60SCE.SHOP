import { describe, it, expect } from 'bun:test';
import { CreateTenantSchema } from './create-tenant.schema';

describe('CreateTenantSchema (S3)', () => {
    it('should validate correct tenant data', () => {
        const result = CreateTenantSchema.safeParse({
            subdomain: 'valid-subdomain',
            ownerEmail: 'test@example.com',
            storeName: 'Valid Store',
            planId: 'basic',
            password: 'password123'
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid subdomain', () => {
        const result = CreateTenantSchema.safeParse({
            subdomain: 'Invalid Subdomain', // Uppercase and space
            ownerEmail: 'test@example.com',
            storeName: 'Store',
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
        const result = CreateTenantSchema.safeParse({
            subdomain: 'valid',
            ownerEmail: 'not-an-email',
            storeName: 'Store',
        });
        expect(result.success).toBe(false);
    });
});
