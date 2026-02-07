import { describe, it, expect } from 'vitest';
import { tenantStorage } from './tenant-context.js';
import { getCurrentTenantId, getCurrentSubdomain, getTenantSchemaName } from './connection-context.js';

describe('Middleware: Connection Context Helpers', () => {
    it('should throw if called outside tenant context', () => {
        expect(() => getCurrentTenantId()).toThrow('S2 Violation');
    });

    it('should return correct values when inside tenant context', () => {
        const mockContext = {
            tenantId: '123-abc',
            subdomain: 'coffee',
            plan: 'basic' as const,
            features: []
        };

        tenantStorage.run(mockContext, () => {
            expect(getCurrentTenantId()).toBe('123-abc');
            expect(getCurrentSubdomain()).toBe('coffee');
            expect(getTenantSchemaName()).toBe('tenant_123-abc');
        });
    });
});
