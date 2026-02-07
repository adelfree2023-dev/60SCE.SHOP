/**
 * Provision Request DTO
 */

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProvisionRequestSchema = z.object({
  /**
   * Unique subdomain for the store (e.g., "coffee-beans")
   */
  subdomain: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9-]+$/,
      'Subdomain must be lowercase alphanumeric and hyphens only'
    ),

  /**
   * Display name of the store
   */
  storeName: z.string().min(2).max(100),

  /**
   * Initial administrator email
   */
  adminEmail: z.string().email(),

  /**
   * Plan level for the new tenant
   */
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),

  /**
   * Optional Super Admin secret key
   */
  superAdminKey: z.string().optional(),
});

export class ProvisionRequestDto extends createZodDto(ProvisionRequestSchema) {}
