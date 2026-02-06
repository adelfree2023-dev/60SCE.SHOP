import { z } from 'zod';

export const CreateTenantSchema = z.object({
    subdomain: z.string()
        .min(3, 'Subdomain too short')
        .max(63, 'Subdomain too long')
        .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/, 'Invalid subdomain format'),
    ownerEmail: z.string().email(),
    storeName: z.string().min(1, 'Store name is required'),
    planId: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
    blueprintId: z.string().default('standard'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
