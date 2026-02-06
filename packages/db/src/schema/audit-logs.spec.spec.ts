import { describe, it, expect } from 'bun:test';
import * as schema from './audit-logs.spec';

describe('DB Schema: audit-logs.spec', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
