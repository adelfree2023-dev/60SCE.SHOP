import { describe, it, expect } from 'bun:test';
import { SecurityModule } from './security.module';

describe('SecurityModule', () => {
    it('should be defined', () => {
        const module = new SecurityModule();
        expect(module).toBeDefined();
    });
});
