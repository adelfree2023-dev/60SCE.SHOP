import { z } from 'zod';

export const UpdateBrandingSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    logoUrl: z.string().url().or(z.string().length(0)).optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color code').optional(),
}).strict();

export class UpdateBrandingDto {
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
}
