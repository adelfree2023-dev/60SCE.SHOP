import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().url().min(1, 'REDIS_URL is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

    // Payments - Optional in dev, validated in refine for production
    STRIPE_SECRET_KEY: z.string().optional(),

    MINIO_ENDPOINT: z.string().min(1),
    MINIO_ACCESS_KEY: z.string().min(1),
    MINIO_SECRET_KEY: z.string().min(1), // Base validation, production check in refine

    PORT: z.coerce.number().default(3000),
    COOKIE_DOMAIN: z.string().default('.60sec.shop'),
}).refine(data => {
    // [SEC] S1: Production-only strict validation
    if (data.NODE_ENV === 'production') {
        // Must have STRIPE_SECRET_KEY starting with sk_live_
        if (!data.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
            throw new Error('STRIPE_SECRET_KEY must start with sk_live_ in production');
        }
        // MINIO_SECRET_KEY must be at least 16 characters in production
        if (data.MINIO_SECRET_KEY.length < 16) {
            throw new Error('MINIO_SECRET_KEY must be at least 16 characters in production');
        }
        // Prevent dummy secrets
        if (data.JWT_SECRET.toLowerCase().includes('default') || data.JWT_SECRET.toLowerCase().includes('secret')) {
            throw new Error('Default or simple secrets are NOT allowed in production');
        }
    }
    return true;
});

// [SEC] S1: Lazy validation to allow tests to override env before parsing
export function getEnv() {
    return envSchema.parse(process.env);
}

export const env = process.env.NODE_ENV === 'test' ? ({} as any) : envSchema.parse(process.env);
