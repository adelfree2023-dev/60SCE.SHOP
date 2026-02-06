import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { createTool } from './lib/tool-wrapper.js';
import { z } from 'zod';
import { validateTenantIsolation } from './tools/security.js';
import { provisionTenant } from './tools/provisioning.js';

// Mock Dependencies
const mockPool = {
    query: mock().mockResolvedValue({ rows: [], rowCount: 0 }),
} as any;

describe('Constitutional AI Gateway', () => {
    
    // --- Layer 1 Tests (Base) ---
    const sensitiveTool = createTool({
        name: 'nuclear_launch',
        description: 'Dangerous tool',
        schema: z.object({ code: z.string() }),
        requiredRole: 'ai.deployer',
        handler: async (args, context) => {
            return { status: 'LAUNCHED', code: args.code };
        }
    });

    it('(Layer 1) should BLOCK execution if role is insufficient (RBAC)', async () => {
        const lowPrivContext = {
            requestRole: 'ai.auditor' as any,
            pool: mockPool
        };
        try {
            await sensitiveTool.execute({ code: '123' }, lowPrivContext);
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toContain('Permission Denied');
        }
    });

    it('(Layer 1) should ALLOW execution if role is sufficient', async () => {
        const highPrivContext = {
            requestRole: 'ai.deployer' as any,
            pool: mockPool
        };
        const result = await sensitiveTool.execute({ code: '123' }, highPrivContext);
        expect(result.status).toBe('LAUNCHED');
    });

    // --- Layer 2 Tests (Skills -> Tools) ---

    it('(Layer 2) validate_tenant_isolation should detect missing filters', async () => {
        const context = { requestRole: 'ai.auditor' as any, pool: mockPool };
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        
        // Unsafe Query
        const unsafe = await validateTenantIsolation.execute({
            sql: 'SELECT * FROM orders', // No tenant_id
            tenantId: validUuid
        }, context);
        
        expect(unsafe.isSafe).toBe(false);
        expect(unsafe.violations[0]).toContain('explicit tenant_id filter');

        // Safe Query
        const safe = await validateTenantIsolation.execute({
            sql: 'SELECT * FROM orders WHERE tenant_id = ',
            tenantId: validUuid
        }, context);
        
        expect(safe.isSafe).toBe(true);
    });

    it('(Layer 2) provision_tenant should initiate provisioning', async () => {
        const context = { requestRole: 'ai.deployer' as any, pool: mockPool };
        
        // Mock successful insert
        mockPool.query.mockResolvedValueOnce({ rowCount: 0 }); // Check existence (not found)
        mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'new-tenant-id' }] }); // Insert result

        const res = await provisionTenant.execute({
            name: 'New Corp',
            subdomain: 'newcorp',
            email: 'admin@newcorp.com',
            plan: 'pro'
        }, context);

        expect(res.status).toBe('PROVISIONING_INITIATED');
        expect(res.tenantId).toBe('new-tenant-id');
    });
});
