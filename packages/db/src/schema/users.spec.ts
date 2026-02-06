import { describe, it, expect } from 'bun:test';
import { users } from './users';

describe('Users Schema', () => {
    it('should define the users table structure', () => {
        expect(users).toBeDefined();
    });
});
