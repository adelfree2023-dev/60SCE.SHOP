import { z } from 'zod';
import { createTool } from '../lib/tool-wrapper.js';

export const ListTenantsSchema = z.object({
    limit: z.number().optional().default(10),
    search: z.string().optional()
});

export const listTenantsTool = createTool({
    name: 'list-tenants',
    description: 'List active tenants in the Apex platform',
    schema: ListTenantsSchema,
    requiredRole: 'ai.auditor', // Minimum role required
    handler: async (args, context) => {
        const { limit, search } = args;
        let query = 'SELECT id, subdomain, status, created_at FROM public.tenants WHERE deleted_at IS NULL';
        const params: any[] = [];

        if (search) {
            query += ' AND (subdomain ILIKE  OR name ILIKE )';
            params.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT ${limit}`;
        
        const res = await context.pool.query(query, params);
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(res.rows, null, 2)
                }
            ]
        };
    }
});
