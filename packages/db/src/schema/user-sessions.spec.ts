import { describe, it, expect } from 'bun:test';
import * as schema from './user-sessions';

describe('DB Schema: user-sessions', () => {
    it('should expect safe export', () => {
       expect(schema).toBeDefined();
    });
});
