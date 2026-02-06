import { z } from 'zod';

/**
 * Address DTOs with Zod validation
 * [SEC] S3: All fields validated before processing
 */

export const CreateAddressSchema = z.object({
    label: z.string().min(1).max(50),
    recipientName: z.string().min(1).max(255),
    phone: z.string().min(5).max(20),
    street: z.string().min(5).max(500),
    building: z.string().max(50).optional(),
    floor: z.string().max(10).optional(),
    apartment: z.string().max(10).optional(),
    landmark: z.string().max(500).optional(),
    city: z.string().min(1).max(100),
    postalCode: z.string().max(20).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    isDefault: z.boolean().optional(),
});

export type CreateAddressDto = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = CreateAddressSchema.partial();

export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>;
