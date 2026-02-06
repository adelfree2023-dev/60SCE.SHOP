import { describe, it, expect } from 'bun:test';
import { Roles } from './roles.decorator';

describe('RolesDecorator', () => {
    it('should be defined', () => {
        expect(Roles).toBeDefined();
    });
});
