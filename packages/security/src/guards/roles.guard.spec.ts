import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
    it('should be defined', () => {
        expect(RolesGuard).toBeDefined();
    });
});
