import { describe, it, expect } from 'bun:test';
import { onboardingBlueprints } from './blueprints';

describe('Blueprints Schema', () => {
    it('should define the onboarding_blueprints table structure', () => {
        expect(onboardingBlueprints).toBeDefined();
    });
});
