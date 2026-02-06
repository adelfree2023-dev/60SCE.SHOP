import { describe, it, expect } from 'bun:test';
import * as schema from './addresses';

describe('DB Schema: addresses', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
