import { describe, it, expect } from 'bun:test';
import * as schema from './wallet-transactions';

describe('DB Schema: wallet-transactions', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
