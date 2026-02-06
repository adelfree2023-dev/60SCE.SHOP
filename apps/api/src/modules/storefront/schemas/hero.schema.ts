import { z } from 'zod';

export const UpdateHeroSchema = z.object({
    title: z.string().min(1).max(200),
    subtitle: z.string().max(500).optional(),
    imageUrl: z.string().url().or(z.string().length(0)).optional(),
    ctaText: z.string().max(50),
    ctaUrl: z.string().max(200),
}).strict();

export class UpdateHeroDto {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText: string;
    ctaUrl: string;
}
