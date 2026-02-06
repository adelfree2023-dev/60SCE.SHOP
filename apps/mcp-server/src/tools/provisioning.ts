import { z } from 'zod';
import { createTool } from '../lib/tool-wrapper.js';

export const provisionTenant = createTool({
    name: 'provision_tenant',
    description: 'Provisions a new tenant with strict S2 isolation (60s Goal)',
    requiredRole: 'ai.deployer', // Requires higher privilege
    schema: z.object({
        name: z.string().min(3),
        subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
        email: z.string().email(),
        plan: z.enum(['starter', 'pro', 'enterprise'])
    }),
    handler: async (args, context) => {
        const { pool } = context;
        // This tool effectively wraps the internal API or ProvisioningService logic
        // For the MCP interface, we call the DB directly to insert the request,
        // relying on the background worker (which we verified in Phase 2) to pick it up.
        
        // 1. Check if subdomain exists
        const check = await pool.query('SELECT 1 FROM public.tenants WHERE subdomain = ', [args.subdomain]);
        if (check.rowCount && check.rowCount > 0) {
            throw new Error(`Subdomain ${args.subdomain} is already taken.`);
        }

        // 2. Insert Tenant Request (ProvisioningService will handle the heavy lifting)
        const res = await pool.query(
            `INSERT INTO public.tenants (name, subdomain, status, plan, created_at) 
             VALUES (, , 'provisioning', , NOW()) 
             RETURNING id, status`,
            [args.name, args.subdomain, args.plan]
        );

        return {
            tenantId: res.rows[0].id,
            status: 'PROVISIONING_INITIATED',
            message: 'Tenant provisioning started. Check status in 60s.'
        };
    }
});
