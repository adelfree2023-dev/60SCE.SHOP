import { describe, it, expect } from 'bun:test';
import * as schema from './tenants.spec';

describe('DB Schema: tenants.spec', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
