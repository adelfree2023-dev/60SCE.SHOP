import { describe, it, expect } from 'bun:test';
import { tenants } from './tenants';

describe('Tenants Schema', () => {
    it('should have correct metadata', () => {
        expect(tenants).toBeDefined();
        expect(tenants).toBeDefined();
        // Verify a known column exists
        expect(tenants.id).toBeDefined();
    });
});
