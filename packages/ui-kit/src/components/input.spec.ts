import { describe, it, expect } from 'bun:test';
import { Input } from './input';

// We just test that the file imports correctly and has the correct displayName
// Logic testing for simple HTML wrappers is minimal in Bun without JSDOM full emulation
describe('Input Component', () => {
    it('should have correct display name', () => {
        expect(Input.displayName).toBe('Input');
    });
});
