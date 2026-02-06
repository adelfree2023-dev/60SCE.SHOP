import { z } from 'zod';

export const BlueprintConfigSchema = z.object({
    steps: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        required: z.boolean().default(true),
    })),
    welcome_message: z.string().optional(),
    completion_message: z.string().optional(),
}).strict();

export const BlueprintSchema = z.object({
    name: z.string().min(3).max(100),
    config: BlueprintConfigSchema,
    is_default: z.boolean().default(false),
}).strict();

export type BlueprintConfig = z.infer<typeof BlueprintConfigSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;
