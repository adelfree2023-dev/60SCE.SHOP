import { z } from 'zod';

/**
 * Customer Profile DTOs
 * [SEC] S3: Zod validation for sensitive operations
 */

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
