import { describe, it, expect } from 'bun:test';
import * as schema from './audit-logs.schema.spec';

describe('DB Schema: audit-logs.schema.spec', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
