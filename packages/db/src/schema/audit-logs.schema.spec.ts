import { auditLogs } from './audit-logs';
import { getTableConfig } from 'drizzle-orm/pg-core';

describe('AuditLogs Schema', () => {
    it('should be defined', () => {
        expect(auditLogs).toBeDefined();
    });

    it('should have correct table name', () => {
        const config = getTableConfig(auditLogs);
        expect(config.name).toBe('audit_logs');
    });

    it('should have required columns', () => {
        // Drizzle schema objects contain column definitions
        expect(auditLogs.id).toBeDefined();
        expect(auditLogs.tenantId).toBeDefined();
        expect(auditLogs.userId).toBeDefined();
        expect(auditLogs.action).toBeDefined();
        expect(auditLogs.status).toBeDefined();
        expect(auditLogs.createdAt).toBeDefined();
    });
});
