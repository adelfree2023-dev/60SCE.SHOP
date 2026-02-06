import { describe, it, expect } from 'bun:test';
import * as schema from './wishlist';

describe('DB Schema: wishlist', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
