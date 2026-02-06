import { describe, it, expect } from 'bun:test';
import { auditLogs } from './audit-logs';

describe('AuditLogs Schema', () => {
    it('should have correct metadata', () => {
        expect(auditLogs).toBeDefined();
        expect(auditLogs).toBeDefined();
        // Verify a known column exists
        expect(auditLogs.id).toBeDefined();
    });
});
