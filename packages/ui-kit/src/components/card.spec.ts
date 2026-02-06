import { describe, it, expect } from 'bun:test';
import { Card, CardHeader, CardTitle, CardContent } from './card';

describe('Card Component Family', () => {
    it('should export all sub-components', () => {
        expect(Card.displayName).toBe('Card');
        expect(CardHeader.displayName).toBe('CardHeader');
        expect(CardTitle.displayName).toBe('CardTitle');
        expect(CardContent.displayName).toBe('CardContent');
    });
});
