import { describe, it, expect } from 'bun:test';
import { loginSchema } from './login.schema';

describe('Login Schema (S3)', () => {
    it('should validate correct login data', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: 'securePassword123'
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
        const result = loginSchema.safeParse({
            email: 'invalid-email',
            password: 'password123'
        });
        expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: '123'
        });
        expect(result.success).toBe(false);
    });
});
