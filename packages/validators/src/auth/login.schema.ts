import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    subdomain: z.string().min(3).max(63).optional(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export const loginSchema = LoginSchema;
