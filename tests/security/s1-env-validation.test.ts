import { describe, it, expect } from 'bun:test';
import { env } from '../../packages/config/src/index';

describe('S1 Integration Test', () => {
    it('should validate environment', () => {
        console.log('🔍 Execution: S1 Validation Test');
        expect(env.DATABASE_URL).toBeDefined();
        expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
        console.log('✅ S1: Environment validated successfully');
    });
});
