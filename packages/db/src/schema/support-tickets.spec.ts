import { describe, it, expect } from 'bun:test';
import * as schema from './support-tickets';

describe('DB Schema: support-tickets', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
